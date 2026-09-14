<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/helpers.php';

$data = json_decode(file_get_contents("php://input"));
if (empty($data->code)) apiError("Code required");

try {
    $stmt = $conn->prepare("SELECT * FROM discounts WHERE code = :code AND active = 1");
    $stmt->bindParam(":code", $data->code);
    $stmt->execute();
    $discount = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$discount) apiError("Discount not found or inactive");
    if ($discount['max_uses'] > 0 && $discount['used_count'] >= $discount['max_uses']) apiError("Discount usage limit reached");
    if ($discount['start_date'] && date('Y-m-d') < $discount['start_date']) apiError("Discount not yet active");
    if ($discount['end_date'] && date('Y-m-d') > $discount['end_date']) apiError("Discount has expired");
    apiSuccess($discount);
} catch (PDOException $e) { handleDbError($e); }
