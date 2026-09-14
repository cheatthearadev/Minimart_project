<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAuth();

$data = json_decode(file_get_contents("php://input"));
validateRequired($data, ['id', 'name']);

try {
    $color = isset($data->color) ? $data->color : '#6366f1';
    $desc = isset($data->description) ? $data->description : null;
    $stmt = $conn->prepare("UPDATE categories SET name=:name, description=:description, color=:color WHERE id=:id");
    $stmt->bindParam(":id", $data->id);
    $stmt->bindParam(":name", sanitizeString($data->name));
    $stmt->bindParam(":description", sanitizeString($desc));
    $stmt->bindParam(":color", sanitizeString($color));
    $stmt->execute();
    apiSuccess(["message" => "Category updated"]);
} catch (PDOException $e) { handleDbError($e); }
