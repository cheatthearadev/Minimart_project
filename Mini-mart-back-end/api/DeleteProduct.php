<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') apiError("Method not allowed", 405);

$data = json_decode(file_get_contents("php://input"));
if (empty($data) || empty($data->id)) apiError("Missing product ID");

try {
    $stmt = $conn->prepare("DELETE FROM products WHERE id = :id");
    $stmt->bindParam(":id", $data->id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        apiSuccess(["message" => "Product deleted"]);
    } else {
        apiError("Product not found", 404);
    }
} catch (PDOException $e) {
    handleDbError($e);
}
