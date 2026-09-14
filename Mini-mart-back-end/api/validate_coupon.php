<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/helpers.php';

$data = json_decode(file_get_contents("php://input"));
if (empty($data->code)) apiError("Coupon code is required");

$order_total = isset($data->order_total) ? floatval($data->order_total) : 0;

try {
    $stmt = $conn->prepare("SELECT * FROM coupons WHERE code = :code LIMIT 1");
    $stmt->bindParam(":code", $data->code);
    $stmt->execute();
    $coupon = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$coupon) apiError("Coupon code not found");
    if (!$coupon['is_active']) apiError("This coupon is no longer active");
    if ($coupon['expires_at'] && date('Y-m-d') > $coupon['expires_at']) apiError("This coupon has expired");
    if ($coupon['max_uses'] !== null && intval($coupon['max_uses']) > 0 && intval($coupon['used_count']) >= intval($coupon['max_uses'])) apiError("This coupon has reached its usage limit");
    if ($coupon['min_order_amount'] !== null && floatval($coupon['min_order_amount']) > 0 && $order_total < floatval($coupon['min_order_amount'])) {
        apiError("Minimum order of $" . number_format(floatval($coupon['min_order_amount']), 2) . " required");
    }

    if ($coupon['type'] === 'percentage') {
        $discount_amount = round($order_total * floatval($coupon['value']) / 100, 2);
    } else {
        $discount_amount = round(min(floatval($coupon['value']), $order_total), 2);
    }

    apiSuccess([
        "id" => intval($coupon['id']),
        "code" => $coupon['code'],
        "type" => $coupon['type'],
        "value" => floatval($coupon['value']),
        "discount_amount" => $discount_amount
    ]);
} catch (PDOException $e) { handleDbError($e); }
