<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';
include_once __DIR__ . '/../Model/User.php';

JWT::requireAdmin();

$data = json_decode(file_get_contents("php://input"));
validateRequired($data, ['username', 'password']);

if (strlen($data->password) < 6) apiError("Password must be at least 6 characters");

$role = !empty($data->role) ? $data->role : 'cashier';
$validRoles = ['admin', 'supervisor', 'cashier', 'stock_clerk'];
if (!in_array($role, $validRoles)) apiError("Invalid role");

$userModel = new UserModel($conn);
$full_name = !empty($data->full_name) ? sanitizeString($data->full_name) : null;
$profile_image = !empty($data->profile_image) ? $data->profile_image : null;
$result = $userModel->register($data->username, $data->password, $role, $full_name, $profile_image);

if (isset($result['error'])) {
    apiError($result['error']);
} else {
    apiSuccess($result);
}
