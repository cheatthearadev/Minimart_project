<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAuth();

$data = json_decode(file_get_contents("php://input"));
validateRequired($data, ['name']);

try {
    $color = isset($data->color) ? $data->color : '#6366f1';
    $desc = isset($data->description) ? $data->description : null;
    $stmt = $conn->prepare("INSERT INTO categories (name, description, color) VALUES (:name, :description, :color)");
    $stmt->bindParam(":name", sanitizeString($data->name));
    $stmt->bindParam(":description", sanitizeString($desc));
    $stmt->bindParam(":color", sanitizeString($color));
    $stmt->execute();
    apiSuccess(["message" => "Category created", "id" => $conn->lastInsertId()]);
} catch (PDOException $e) { handleDbError($e); }
