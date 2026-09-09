<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
include_once __DIR__ . '/../config/database.php';
$data = json_decode(file_get_contents("php://input"));
if (empty($data->code)) { echo json_encode(["error" => "Code required"]); exit(); }
try {
    $stmt = $conn->prepare("SELECT * FROM discounts WHERE code = :code AND active = 1");
    $stmt->bindParam(":code", $data->code);
    $stmt->execute();
    $discount = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$discount) { echo json_encode(["error" => "Discount not found or inactive"]); exit(); }
    if ($discount['max_uses'] > 0 && $discount['used_count'] >= $discount['max_uses']) { echo json_encode(["error" => "Discount usage limit reached"]); exit(); }
    if ($discount['start_date'] && date('Y-m-d') < $discount['start_date']) { echo json_encode(["error" => "Discount not yet active"]); exit(); }
    if ($discount['end_date'] && date('Y-m-d') > $discount['end_date']) { echo json_encode(["error" => "Discount has expired"]); exit(); }
    echo json_encode($discount);
} catch (PDOException $e) { echo json_encode(["error" => $e->getMessage()]); }
