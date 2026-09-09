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

if (empty($data->id)) {
    echo json_encode(["error" => "Product ID is required"]);
    exit();
}

try {
    $stmt = $conn->prepare("UPDATE products SET is_favorite = NOT is_favorite WHERE id = :id");
    $stmt->bindParam(":id", $data->id);
    $stmt->execute();

    $stmt = $conn->prepare("SELECT id, is_favorite FROM products WHERE id = :id");
    $stmt->bindParam(":id", $data->id);
    $stmt->execute();
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(["id" => $product['id'], "is_favorite" => (int)$product['is_favorite']]);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
