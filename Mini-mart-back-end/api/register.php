<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../controllers/Authcontroller.php';
include_once __DIR__ . '/../config/helpers.php';

$controller = new AuthController();
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->username) && !empty($data->password)) {
    if (strlen($data->password) < 6) apiError("Password must be at least 6 characters");
    $role = isset($data->role) ? $data->role : 'cashier';
    $result = $controller->register($data->username, $data->password, $role);
    if (isset($result['error'])) {
        apiError($result['error']);
    } else {
        apiSuccess($result);
    }
} else {
    apiError("Please provide username and password");
}
