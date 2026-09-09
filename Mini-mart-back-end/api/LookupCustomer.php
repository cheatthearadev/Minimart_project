<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
include_once __DIR__ . '/../config/database.php';

$data = json_decode(file_get_contents("php://input"));

if (empty($data->phone)) {
    echo json_encode(["error" => "Phone number is required"]);
    exit();
}

try {
    $phone = trim($data->phone);
    $stmt = $conn->prepare("SELECT id, name, phone, email, points, total_spent FROM customers WHERE phone = :phone LIMIT 1");
    $stmt->bindParam(":phone", $phone);
    $stmt->execute();
    $customer = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($customer) {
        $customer["is_new"] = false;
        echo json_encode($customer);
        exit();
    }

    $name = !empty($data->name) ? trim($data->name) : null;
    $email = !empty($data->email) ? trim($data->email) : null;
    $stmt = $conn->prepare("INSERT INTO customers (name, phone, email) VALUES (:name, :phone, :email)");
    $stmt->bindParam(":name", $name);
    $stmt->bindParam(":phone", $phone);
    $stmt->bindParam(":email", $email);
    $stmt->execute();

    echo json_encode([
        "id" => $conn->lastInsertId(),
        "name" => $name,
        "phone" => $phone,
        "email" => $email,
        "points" => 0,
        "total_spent" => "0.00",
        "is_new" => true
    ]);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}