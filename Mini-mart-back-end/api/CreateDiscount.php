<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
include_once __DIR__ . '/../config/database.php';
$data = json_decode(file_get_contents("php://input"));
if (empty($data->code) || empty($data->type) || empty($data->value)) { echo json_encode(["error" => "Code, type and value are required"]); exit(); }
try {
    $min_order = $data->min_order ?? 0;
    $max_uses = $data->max_uses ?? 0;
    $start_date = $data->start_date ?? null;
    $end_date = $data->end_date ?? null;
    $stmt = $conn->prepare("INSERT INTO discounts (code, type, value, min_order, max_uses, start_date, end_date) VALUES (:code, :type, :value, :min_order, :max_uses, :start_date, :end_date)");
    $stmt->bindParam(":code", $data->code);
    $stmt->bindParam(":type", $data->type);
    $stmt->bindParam(":value", $data->value);
    $stmt->bindParam(":min_order", $min_order);
    $stmt->bindParam(":max_uses", $max_uses);
    $stmt->bindParam(":start_date", $start_date);
    $stmt->bindParam(":end_date", $end_date);
    $stmt->execute();
    echo json_encode(["message" => "Discount created", "id" => $conn->lastInsertId()]);
} catch (PDOException $e) { echo json_encode(["error" => $e->getMessage()]); }
