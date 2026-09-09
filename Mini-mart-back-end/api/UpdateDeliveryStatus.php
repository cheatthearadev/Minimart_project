<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once __DIR__ . '/../config/database.php';

$data = json_decode(file_get_contents("php://input"));

if (empty($data->id) || empty($data->status)) {
    echo json_encode(["error" => "សូមបំពេញ ID និងស្ថានភាព"]);
    exit();
}

$valid_statuses = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
if (!in_array($data->status, $valid_statuses)) {
    echo json_encode(["error" => "ស្ថានភាពមិនត្រឹមត្រូវ"]);
    exit();
}

try {
    $stmt = $conn->prepare("UPDATE deliveries SET status = :status WHERE id = :id");
    $stmt->bindParam(":status", $data->status);
    $stmt->bindParam(":id", $data->id);
    $stmt->execute();

    if (isset($data->driver_name) && isset($data->driver_phone)) {
        $stmt = $conn->prepare("UPDATE deliveries SET driver_name = :driver_name, driver_phone = :driver_phone WHERE id = :id");
        $stmt->bindParam(":driver_name", $data->driver_name);
        $stmt->bindParam(":driver_phone", $data->driver_phone);
        $stmt->bindParam(":id", $data->id);
        $stmt->execute();
    }

    if ($data->status === 'delivered') {
        $stmt = $conn->prepare("UPDATE deliveries SET actual_delivery_time = NOW() WHERE id = :id");
        $stmt->bindParam(":id", $data->id);
        $stmt->execute();
    }

    echo json_encode(["message" => "ស្ថានភាពការដឹកជញ្ជូនត្រូវបានអាប់ដេតជោគជ័យ!", "id" => $data->id, "status" => $data->status]);

} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
