<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once __DIR__ . '/../controllers/Authcontroller.php';

$controller = new AuthController();
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->username) && !empty($data->password)) {
    $role = isset($data->role) ? $data->role : 'cashier';
    $result = $controller->register($data->username, $data->password, $role);
    echo json_encode($result);
} else {
    echo json_encode(array("error" => "សូមបំពេញឈ្មោះអ្នកប្រើប្រាស់ និងពាក្យសម្ងាត់ឱ្យបានគ្រប់គ្រាន់។"));
}
