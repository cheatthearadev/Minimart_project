<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAdmin();

$data = json_decode(file_get_contents("php://input"));
if (empty($data->id)) apiError("ID required");

try {
    $fields = []; $params = [":id" => $data->id];
    if (!empty($data->full_name)) { $fields[] = "full_name = :full_name"; $params[":full_name"] = sanitizeString($data->full_name); }
    if (isset($data->profile_image)) { $fields[] = "profile_image = :profile_image"; $params[":profile_image"] = $data->profile_image; }
    if (!empty($data->role)) {
        $validRoles = ['admin', 'supervisor', 'cashier', 'stock_clerk'];
        if (!in_array($data->role, $validRoles)) apiError("Invalid role");
        $fields[] = "role = :role"; $params[":role"] = $data->role;
    }
    if (!empty($data->password)) {
        if (strlen($data->password) < 6) apiError("Password must be at least 6 characters");
        $fields[] = "password = :password"; $params[":password"] = password_hash($data->password, PASSWORD_DEFAULT);
    }
    if (empty($fields)) apiError("No fields to update");
    $stmt = $conn->prepare("UPDATE user SET " . implode(', ', $fields) . " WHERE id = :id");
    $stmt->execute($params);
    apiSuccess(["message" => "User updated"]);
} catch (PDOException $e) { handleDbError($e); }
