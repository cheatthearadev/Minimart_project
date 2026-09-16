<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAuth();

$data = json_decode(file_get_contents("php://input"));
if (empty($data->id) || empty($data->status)) apiError("ID and status are required");

$valid_statuses = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
if (!in_array($data->status, $valid_statuses)) apiError("Invalid status");

try {
    $stmt = $conn->prepare("UPDATE deliveries SET status = :status WHERE id = :id");
    $stmt->bindParam(":status", $data->status);
    $stmt->bindParam(":id", $data->id);
    $stmt->execute();

    if (isset($data->driver_name) && isset($data->driver_phone)) {
        $dName = sanitizeString($data->driver_name);
        $dPhone = sanitizeString($data->driver_phone);
        $stmt = $conn->prepare("UPDATE deliveries SET driver_name = :driver_name, driver_phone = :driver_phone WHERE id = :id");
        $stmt->bindParam(":driver_name", $dName);
        $stmt->bindParam(":driver_phone", $dPhone);
        $stmt->bindParam(":id", $data->id);
        $stmt->execute();
    }

    if ($data->status === 'delivered') {
        $stmt = $conn->prepare("UPDATE deliveries SET actual_delivery_time = NOW() WHERE id = :id");
        $stmt->bindParam(":id", $data->id);
        $stmt->execute();
    }

    apiSuccess(["message" => "Delivery status updated", "id" => $data->id, "status" => $data->status]);
} catch (PDOException $e) { handleDbError($e); }
