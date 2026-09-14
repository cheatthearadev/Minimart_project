<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAdmin();

$data = json_decode(file_get_contents("php://input"));
if (empty($data->id)) apiError("ID required");

try {
    $stmt = $conn->prepare("DELETE FROM discounts WHERE id = :id");
    $stmt->bindParam(":id", $data->id);
    $stmt->execute();
    apiSuccess(["message" => "Discount deleted"]);
} catch (PDOException $e) { handleDbError($e); }
