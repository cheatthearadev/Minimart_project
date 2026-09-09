<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../controllers/Authcontroller.php';

$data = json_decode(file_get_contents("php://input"));

if (empty($data->username) || empty($data->password)) {
    echo json_encode(["error" => "Username and password are required"]);
    exit();
}

if (empty($data->admin_id)) {
    echo json_encode(["error" => "Admin authentication required"]);
    exit();
}

$stmt = $conn->prepare("SELECT role FROM user WHERE id = :id LIMIT 1");
$stmt->bindParam(":id", $data->admin_id);
$stmt->execute();
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$admin || $admin['role'] !== 'admin') {
    echo json_encode(["error" => "Only admins can create users"]);
    exit();
}

$role = !empty($data->role) ? $data->role : 'cashier';
$validRoles = ['admin', 'supervisor', 'cashier', 'stock_clerk'];
if (!in_array($role, $validRoles)) {
    echo json_encode(["error" => "Invalid role"]);
    exit();
}

$controller = new AuthController();
$full_name = !empty($data->full_name) ? $data->full_name : null;
$profile_image = !empty($data->profile_image) ? $data->profile_image : null;
$result = $controller->register($data->username, $data->password, $role, $full_name, $profile_image);
echo json_encode($result);
