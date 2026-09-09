<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/loyalty.php';

$data = json_decode(file_get_contents("php://input"));

if (empty($data->items) || !is_array($data->items) || count($data->items) === 0) {
    echo json_encode(["error" => "មិនមានទំនិញក្នុងកន្ត្រកទេ"]);
    exit();
}

if (!isset($data->cash_received) || $data->cash_received <= 0) {
    echo json_encode(["error" => "សូមបញ្ចូលចំនួនទឹកប្រាក់ដែលទទួលបាន"]);
    exit();
}

$order_type = isset($data->order_type) ? $data->order_type : 'dine_in';
$valid_types = ['dine_in', 'takeaway', 'delivery'];
if (!in_array($order_type, $valid_types)) {
    $order_type = 'dine_in';
}

if ($order_type === 'delivery') {
    if (empty($data->delivery_address) || empty($data->delivery_name) || empty($data->delivery_phone)) {
        echo json_encode(["error" => "សូមបំពេញព័ត៌មានការដឹកជញ្ជូន (ឈ្មោះ, ទូរស័ព្ទ, អាសយដ្ឋាន)"]);
        exit();
    }
}

try {
    $conn->beginTransaction();

    $total_amount = 0;
    foreach ($data->items as $item) {
        if (empty($item->id) || empty($item->quantity) || $item->quantity <= 0) {
            $conn->rollBack();
            echo json_encode(["error" => "ទិន្នន័យទំនិញមិនត្រឹមត្រូវ"]);
            exit();
        }

        $stmt = $conn->prepare("SELECT id, name, price, stock FROM products WHERE id = :id FOR UPDATE");
        $stmt->bindParam(":id", $item->id);
        $stmt->execute();
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$product) {
            $conn->rollBack();
            echo json_encode(["error" => "ទំនិញ ID {$item->id} មិនមានឡើយ"]);
            exit();
        }

        if ($product['stock'] < $item->quantity) {
            $conn->rollBack();
            echo json_encode(["error" => "ស្តុកទំនិញ \"{$product['name']}\" មិនគ្រប់គ្រាន់ (នៅសល់ {$product['stock']})"]);
            exit();
        }

        $total_amount += $product['price'] * $item->quantity;
    }

    $delivery_fee = 0;
    if ($order_type === 'delivery') {
        $delivery_fee = isset($data->delivery_fee) ? floatval($data->delivery_fee) : 2.00;
    }

    $discount_amount = isset($data->discount_amount) ? floatval($data->discount_amount) : 0;
    $coupon_discount_amount = 0;
    $coupon_code = isset($data->coupon_code) && $data->coupon_code !== '' ? $data->coupon_code : null;

    $user_id = isset($data->user_id) ? $data->user_id : null;
    $customer_id = isset($data->customer_id) ? $data->customer_id : null;
    $discount_id = isset($data->discount_id) ? $data->discount_id : null;

    if (!empty($coupon_code)) {
        $stmt = $conn->prepare("SELECT * FROM coupons WHERE code = :code LIMIT 1");
        $stmt->bindParam(":code", $coupon_code);
        $stmt->execute();
        $coupon = $stmt->fetch(PDO::FETCH_ASSOC);

        $coupon_error = null;
        if (!$coupon) {
            $coupon_error = "Coupon code not found";
        } elseif (!$coupon['is_active']) {
            $coupon_error = "This coupon is no longer active";
        } elseif ($coupon['expires_at'] && date('Y-m-d') > $coupon['expires_at']) {
            $coupon_error = "This coupon has expired";
        } elseif ($coupon['max_uses'] !== null && intval($coupon['max_uses']) > 0 && intval($coupon['used_count']) >= intval($coupon['max_uses'])) {
            $coupon_error = "This coupon has reached its usage limit";
        } elseif ($coupon['min_order_amount'] !== null && floatval($coupon['min_order_amount']) > 0 && $total_amount < floatval($coupon['min_order_amount'])) {
            $coupon_error = "Minimum order of $" . number_format(floatval($coupon['min_order_amount']), 2) . " required for this coupon";
        }

        if ($coupon_error) {
            $conn->rollBack();
            echo json_encode(["error" => $coupon_error]);
            exit();
        }

        // Recalculate the discount server-side to avoid trusting the client value.
        $coupon_discount_amount = $coupon['type'] === 'percentage'
            ? round($total_amount * floatval($coupon['value']) / 100, 2)
            : round(min(floatval($coupon['value']), $total_amount), 2);

        // Only increment when a coupon is actually applied (transaction-safe).
        $stmt = $conn->prepare("UPDATE coupons SET used_count = used_count + 1 WHERE id = :id");
        $stmt->bindParam(":id", $coupon['id']);
        $stmt->execute();
    }

    $total_with_fee = $total_amount - $discount_amount - $coupon_discount_amount + $delivery_fee;

    $invoice_number = 'INV-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
    $cash_received = floatval($data->cash_received);
    $cash_return = $cash_received - $total_with_fee;

    if ($cash_return < 0) {
        $conn->rollBack();
        echo json_encode(["error" => "ទឹកប្រាក់មិនគ្រប់គ្រាន់ (ត្រូវការ $" . number_format($total_with_fee, 2) . ")"]);
        exit();
    }

    $payment_method = isset($data->payment_method) ? $data->payment_method : 'cash';
    if (!in_array($payment_method, ['cash', 'wing'])) {
        $payment_method = 'cash';
    }

    $stmt = $conn->prepare("INSERT INTO orders (invoice_number, order_type, total_amount, cash_received, cash_return, user_id, customer_id, discount_id, coupon_code, subtotal, discount_amount, payment_method, status, created_at) VALUES (:invoice_number, :order_type, :total_amount, :cash_received, :cash_return, :user_id, :customer_id, :discount_id, :coupon_code, :subtotal, :discount_amount, :payment_method, 'completed', NOW())");
    $stmt->bindParam(":invoice_number", $invoice_number);
    $stmt->bindParam(":order_type", $order_type);
    $stmt->bindParam(":total_amount", $total_with_fee);
    $stmt->bindParam(":cash_received", $cash_received);
    $stmt->bindParam(":cash_return", $cash_return);
    $stmt->bindParam(":user_id", $user_id);
    $stmt->bindParam(":customer_id", $customer_id);
    $stmt->bindParam(":discount_id", $discount_id);
    $stmt->bindParam(":coupon_code", $coupon_code);
    $stmt->bindParam(":subtotal", $total_amount);
    $stmt->bindParam(":discount_amount", $discount_amount);
    $stmt->bindParam(":payment_method", $payment_method);
    $stmt->execute();

    $order_id = $conn->lastInsertId();

    foreach ($data->items as $item) {
        $stmt = $conn->prepare("SELECT price FROM products WHERE id = :id");
        $stmt->bindParam(":id", $item->id);
        $stmt->execute();
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $conn->prepare("INSERT INTO order_item (order_id, product_id, quantity, price) VALUES (:order_id, :product_id, :quantity, :price)");
        $stmt->bindParam(":order_id", $order_id);
        $stmt->bindParam(":product_id", $item->id);
        $stmt->bindParam(":quantity", $item->quantity);
        $stmt->bindParam(":price", $product['price']);
        $stmt->execute();

        $stmt = $conn->prepare("UPDATE products SET stock = stock - :qty WHERE id = :id");
        $stmt->bindParam(":qty", $item->quantity);
        $stmt->bindParam(":id", $item->id);
        $stmt->execute();
    }

    if ($order_type === 'delivery') {
        $stmt = $conn->prepare("INSERT INTO deliveries (order_id, customer_name, customer_phone, delivery_address, delivery_notes, delivery_fee, status, estimated_time, created_at) VALUES (:order_id, :customer_name, :customer_phone, :delivery_address, :delivery_notes, :delivery_fee, 'pending', :estimated_time, NOW())");
        $stmt->bindParam(":order_id", $order_id);
        $stmt->bindParam(":customer_name", $data->delivery_name);
        $stmt->bindParam(":customer_phone", $data->delivery_phone);
        $stmt->bindParam(":delivery_address", $data->delivery_address);
        $delivery_notes = isset($data->delivery_notes) ? $data->delivery_notes : null;
        $stmt->bindParam(":delivery_notes", $delivery_notes);
        $stmt->bindParam(":delivery_fee", $delivery_fee);
        $estimated_time = isset($data->estimated_time) ? intval($data->estimated_time) : 30;
        $stmt->bindParam(":estimated_time", $estimated_time);
        $stmt->execute();
    }

    $points_earned = 0;
    $redeem_points = isset($data->redeem_points) ? intval($data->redeem_points) : 0;
    if (!empty($customer_id)) {
        $points_earned = intval($total_with_fee);
        $stmt = $conn->prepare("UPDATE customers SET points = points + :points, total_spent = total_spent + :spent WHERE id = :id");
        $stmt->bindParam(":points", $points_earned);
        $stmt->bindParam(":spent", $total_with_fee);
        $stmt->bindParam(":id", $customer_id);
        $stmt->execute();

        if ($redeem_points > 0) {
            $stmt = $conn->prepare("UPDATE customers SET points = points - :redeem WHERE id = :id AND points >= :redeem2");
            $stmt->bindParam(":redeem", $redeem_points);
            $stmt->bindParam(":id", $customer_id);
            $stmt->bindParam(":redeem2", $redeem_points);
            $stmt->execute();
        }

        // Recompute the loyalty tier from the updated total_spent (same transaction).
        $stmt = $conn->prepare("SELECT total_spent FROM customers WHERE id = :id");
        $stmt->bindParam(":id", $customer_id);
        $stmt->execute();
        $fresh = $stmt->fetch(PDO::FETCH_ASSOC);

        $tier = $fresh ? calculate_loyalty_tier($fresh['total_spent']) : 'bronze';
        $stmt = $conn->prepare("UPDATE customers SET loyalty_tier = :tier WHERE id = :id");
        $stmt->bindParam(":tier", $tier);
        $stmt->bindParam(":id", $customer_id);
        $stmt->execute();
    }

    $conn->commit();

    $response = [
        "message" => $order_type === 'delivery' ? "ការបញ្ជាទិញ និងការដឹកជញ្ជូនជោគជ័យ!" : "ការលក់ជោគជ័យ!",
        "order_id" => $order_id,
        "invoice_number" => $invoice_number,
        "order_type" => $order_type,
        "total_amount" => $total_with_fee,
        "subtotal" => $total_amount,
        "delivery_fee" => $delivery_fee,
        "cash_received" => $cash_received,
        "cash_return" => $cash_return,
        "points_earned" => $points_earned
    ];

    echo json_encode($response);

} catch (PDOException $e) {
    $conn->rollBack();
    echo json_encode(["error" => $e->getMessage()]);
}
