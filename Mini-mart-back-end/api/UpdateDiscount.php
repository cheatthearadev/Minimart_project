<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
include_once __DIR__ . '/../config/database.php';
$data = json_decode(file_get_contents("php://input"));
if (empty($data->id)) { echo json_encode(["error" => "ID required"]); exit(); }
try {
    $fields = [];
    $params = [":id" => $data->id];
    foreach (['code','type','value','min_order','max_uses','start_date','end_date','active'] as $f) {
        if (isset($data->$f)) { $fields[] = "$f = :$f"; $params[":$f"] = $data->$f; }
    }
    if (empty($fields)) { echo json_encode(["error" => "No fields to update"]); exit(); }
    $stmt = $conn->prepare("UPDATE discounts SET " . implode(', ', $fields) . " WHERE id = :id");
    $stmt->execute($params);
    echo json_encode(["message" => "Discount updated"]);
} catch (PDOException $e) { echo json_encode(["error" => $e->getMessage()]); }
