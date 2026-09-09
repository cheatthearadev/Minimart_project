<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
include_once __DIR__ . '/../config/database.php';

$data = json_decode(file_get_contents("php://input"));
if (empty($data->id)) { echo json_encode(["error" => "ID required"]); exit(); }
if (empty($data->admin_id)) { echo json_encode(["error" => "Admin authentication required"]); exit(); }

$stmt = $conn->prepare("SELECT role FROM user WHERE id = :id LIMIT 1");
$stmt->bindParam(":id", $data->admin_id);
$stmt->execute();
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$admin || $admin['role'] !== 'admin') {
    echo json_encode(["error" => "Only admins can update users"]);
    exit();
}

try {
    $fields = []; $params = [":id" => $data->id];
    if (!empty($data->full_name)) { $fields[] = "full_name = :full_name"; $params[":full_name"] = $data->full_name; }
    if (isset($data->profile_image)) { $fields[] = "profile_image = :profile_image"; $params[":profile_image"] = $data->profile_image; }
    if (!empty($data->role)) {
        $validRoles = ['admin', 'supervisor', 'cashier', 'stock_clerk'];
        if (!in_array($data->role, $validRoles)) {
            echo json_encode(["error" => "Invalid role"]); exit();
        }
        $fields[] = "role = :role"; $params[":role"] = $data->role;
    }
    if (!empty($data->password)) { $fields[] = "password = :password"; $params[":password"] = $data->password; }
    if (empty($fields)) { echo json_encode(["error" => "No fields to update"]); exit(); }
    $stmt = $conn->prepare("UPDATE user SET " . implode(', ', $fields) . " WHERE id = :id");
    $stmt->execute($params);
    echo json_encode(["message" => "User updated"]);
} catch (PDOException $e) { echo json_encode(["error" => $e->getMessage()]); }
