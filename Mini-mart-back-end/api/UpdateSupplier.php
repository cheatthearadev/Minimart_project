<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
include_once __DIR__ . '/../config/database.php';
$data = json_decode(file_get_contents("php://input"));
if (empty($data->id) || empty($data->name)) { echo json_encode(["error" => "ID and name are required"]); exit(); }
try {
    $phone = $data->phone ?? null;
    $email = $data->email ?? null;
    $address = $data->address ?? null;
    $notes = $data->notes ?? null;
    $stmt = $conn->prepare("UPDATE suppliers SET name=:name, phone=:phone, email=:email, address=:address, notes=:notes WHERE id=:id");
    $stmt->bindParam(":id", $data->id);
    $stmt->bindParam(":name", $data->name);
    $stmt->bindParam(":phone", $phone);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":address", $address);
    $stmt->bindParam(":notes", $notes);
    $stmt->execute();
    echo json_encode(["message" => "Supplier updated"]);
} catch (PDOException $e) { echo json_encode(["error" => $e->getMessage()]); }
