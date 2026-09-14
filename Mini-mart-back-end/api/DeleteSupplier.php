<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAdmin();

$data = json_decode(file_get_contents("php://input"));
if (empty($data->id)) apiError("ID is required");

try {
    $stmt = $conn->prepare("DELETE FROM suppliers WHERE id = :id");
    $stmt->bindParam(":id", $data->id);
    $stmt->execute();
    apiSuccess(["message" => "Supplier deleted"]);
} catch (PDOException $e) { handleDbError($e); }
