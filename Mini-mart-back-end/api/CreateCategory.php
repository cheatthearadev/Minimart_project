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
    $sName = sanitizeString($data->name);
    $sDesc = sanitizeString($desc);
    $sColor = sanitizeString($color);
    $stmt = $conn->prepare("INSERT INTO categories (name, description, color) VALUES (:name, :description, :color)");
    $stmt->bindParam(":name", $sName);
    $stmt->bindParam(":description", $sDesc);
    $stmt->bindParam(":color", $sColor);
    $stmt->execute();
    apiSuccess(["message" => "Category created", "id" => $conn->lastInsertId()]);
} catch (PDOException $e) { handleDbError($e); }
