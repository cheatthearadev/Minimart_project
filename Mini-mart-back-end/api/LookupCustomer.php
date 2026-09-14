<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/helpers.php';

$data = json_decode(file_get_contents("php://input"));
if (empty($data->phone)) apiError("Phone number is required");

try {
    $phone = sanitizeString(trim($data->phone));
    $stmt = $conn->prepare("SELECT id, name, phone, email, points, total_spent FROM customers WHERE phone = :phone LIMIT 1");
    $stmt->bindParam(":phone", $phone);
    $stmt->execute();
    $customer = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($customer) {
        $customer["is_new"] = false;
        apiSuccess($customer);
    }

    $name = !empty($data->name) ? sanitizeString(trim($data->name)) : null;
    $email = !empty($data->email) ? sanitizeString(trim($data->email)) : null;
    $stmt = $conn->prepare("INSERT INTO customers (name, phone, email) VALUES (:name, :phone, :email)");
    $stmt->bindParam(":name", $name);
    $stmt->bindParam(":phone", $phone);
    $stmt->bindParam(":email", $email);
    $stmt->execute();

    apiSuccess([
        "id" => $conn->lastInsertId(),
        "name" => $name,
        "phone" => $phone,
        "email" => $email,
        "points" => 0,
        "total_spent" => "0.00",
        "is_new" => true
    ]);
} catch (PDOException $e) { handleDbError($e); }
