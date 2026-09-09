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

$data = json_decode(file_get_contents("php://input"));

if (empty($data->code)) {
    echo json_encode(["error" => "Coupon code is required"]);
    exit();
}

$order_total = isset($data->order_total) ? floatval($data->order_total) : 0;

try {
    $stmt = $conn->prepare("SELECT * FROM coupons WHERE code = :code LIMIT 1");
    $stmt->bindParam(":code", $data->code);
    $stmt->execute();
    $coupon = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$coupon) {
        echo json_encode(["error" => "Coupon code not found"]);
        exit();
    }
    if (!$coupon['is_active']) {
        echo json_encode(["error" => "This coupon is no longer active"]);
        exit();
    }
    if ($coupon['expires_at'] && date('Y-m-d') > $coupon['expires_at']) {
        echo json_encode(["error" => "This coupon has expired"]);
        exit();
    }
    if ($coupon['max_uses'] !== null && intval($coupon['max_uses']) > 0 && intval($coupon['used_count']) >= intval($coupon['max_uses'])) {
        echo json_encode(["error" => "This coupon has reached its usage limit"]);
        exit();
    }
    if ($coupon['min_order_amount'] !== null && floatval($coupon['min_order_amount']) > 0 && $order_total < floatval($coupon['min_order_amount'])) {
        echo json_encode(["error" => "Minimum order of $" . number_format(floatval($coupon['min_order_amount']), 2) . " required for this coupon"]);
        exit();
    }

    if ($coupon['type'] === 'percentage') {
        $discount_amount = round($order_total * floatval($coupon['value']) / 100, 2);
    } else {
        $discount_amount = round(min(floatval($coupon['value']), $order_total), 2);
    }

    echo json_encode([
        "id" => intval($coupon['id']),
        "code" => $coupon['code'],
        "type" => $coupon['type'],
        "value" => floatval($coupon['value']),
        "discount_amount" => $discount_amount
    ]);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}