<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAuth();

$data = json_decode(file_get_contents("php://input"));
validateRequired($data, ['name']);

try {
    $phone = sanitizeString($data->phone ?? null);
    $email = sanitizeString($data->email ?? null);
    $address = sanitizeString($data->address ?? null);
    $notes = sanitizeString($data->notes ?? null);
    $sName = sanitizeString($data->name);
    $stmt = $conn->prepare("INSERT INTO suppliers (name, phone, email, address, notes) VALUES (:name, :phone, :email, :address, :notes)");
    $stmt->bindParam(":name", $sName);
    $stmt->bindParam(":phone", $phone);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":address", $address);
    $stmt->bindParam(":notes", $notes);
    $stmt->execute();
    apiSuccess(["message" => "Supplier created", "id" => $conn->lastInsertId()]);
} catch (PDOException $e) { handleDbError($e); }
