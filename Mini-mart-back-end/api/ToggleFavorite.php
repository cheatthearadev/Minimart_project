<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/helpers.php';

$data = json_decode(file_get_contents("php://input"));
if (empty($data->id)) apiError("Product ID is required");

try {
    $stmt = $conn->prepare("UPDATE products SET is_favorite = NOT is_favorite WHERE id = :id");
    $stmt->bindParam(":id", $data->id);
    $stmt->execute();

    $stmt = $conn->prepare("SELECT id, is_favorite FROM products WHERE id = :id");
    $stmt->bindParam(":id", $data->id);
    $stmt->execute();
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    apiSuccess(["id" => $product['id'], "is_favorite" => (int)$product['is_favorite']]);
} catch (PDOException $e) { handleDbError($e); }
