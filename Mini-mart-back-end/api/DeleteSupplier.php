<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
include_once __DIR__ . '/../config/database.php';
$data = json_decode(file_get_contents("php://input"));
if (empty($data->id)) { echo json_encode(["error" => "ID is required"]); exit(); }
try {
    $stmt = $conn->prepare("UPDATE products SET supplier_id = NULL WHERE supplier_id = :id");
    $stmt->bindParam(":id", $data->id);
    $stmt->execute();
    $stmt = $conn->prepare("DELETE FROM suppliers WHERE id = :id");
    $stmt->bindParam(":id", $data->id);
    $stmt->execute();
    echo json_encode(["message" => "Supplier deleted"]);
} catch (PDOException $e) { echo json_encode(["error" => $e->getMessage()]); }
