<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(["error" => "Method not allowed."]); exit(); }
include_once __DIR__ . '/../config/database.php';
$data = json_decode(file_get_contents("php://input"));
if (empty($data) || empty($data->id)) { echo json_encode(["error" => "Missing product ID."]); exit(); }
try {
    $stmt = $conn->prepare("DELETE FROM inventory_log WHERE product_id = :id");
    $stmt->bindParam(":id", $data->id);
    $stmt->execute();
    $stmt = $conn->prepare("DELETE FROM returns WHERE product_id = :id");
    $stmt->bindParam(":id", $data->id);
    $stmt->execute();
    $stmt = $conn->prepare("DELETE FROM order_item WHERE product_id = :id");
    $stmt->bindParam(":id", $data->id);
    $stmt->execute();
    $stmt = $conn->prepare("DELETE FROM products WHERE id = :id");
    $stmt->bindParam(":id", $data->id);
    $stmt->execute();
    if ($stmt->rowCount() > 0) {
        echo json_encode(["message" => "Product deleted"]);
    } else {
        echo json_encode(["error" => "Product not found."]);
    }
} catch (PDOException $e) { echo json_encode(["error" => $e->getMessage()]); }
