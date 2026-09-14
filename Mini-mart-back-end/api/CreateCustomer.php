<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAuth();

$data = json_decode(file_get_contents("php://input"));
validateRequired($data, ['name']);

if (!validateEmail($data->email ?? null)) apiError("Invalid email format");

try {
    $phone = sanitizeString($data->phone ?? null);
    $email = sanitizeString($data->email ?? null);
    $stmt = $conn->prepare("INSERT INTO customers (name, phone, email) VALUES (:name, :phone, :email)");
    $stmt->bindParam(":name", sanitizeString($data->name));
    $stmt->bindParam(":phone", $phone);
    $stmt->bindParam(":email", $email);
    $stmt->execute();
    apiSuccess(["message" => "Customer created", "id" => $conn->lastInsertId()]);
} catch (PDOException $e) { handleDbError($e); }
