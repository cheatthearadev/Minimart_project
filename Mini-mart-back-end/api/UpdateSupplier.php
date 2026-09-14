<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAuth();

$data = json_decode(file_get_contents("php://input"));
validateRequired($data, ['id', 'name']);

try {
    $phone = sanitizeString($data->phone ?? null);
    $email = sanitizeString($data->email ?? null);
    $address = sanitizeString($data->address ?? null);
    $notes = sanitizeString($data->notes ?? null);
    $stmt = $conn->prepare("UPDATE suppliers SET name=:name, phone=:phone, email=:email, address=:address, notes=:notes WHERE id=:id");
    $stmt->bindParam(":id", $data->id);
    $stmt->bindParam(":name", sanitizeString($data->name));
    $stmt->bindParam(":phone", $phone);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":address", $address);
    $stmt->bindParam(":notes", $notes);
    $stmt->execute();
    apiSuccess(["message" => "Supplier updated"]);
} catch (PDOException $e) { handleDbError($e); }
