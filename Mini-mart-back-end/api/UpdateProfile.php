<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

$userId = JWT::requireAuth();

$data = json_decode(file_get_contents("php://input"));

try {
    $fields = []; $params = [":id" => $userId];

    if (!empty($data->full_name)) {
        $fields[] = "full_name = :full_name";
        $params[":full_name"] = sanitizeString($data->full_name);
    }
    if (isset($data->profile_image)) {
        $fields[] = "profile_image = :profile_image";
        $params[":profile_image"] = $data->profile_image;
    }
    if (!empty($data->password)) {
        if (strlen($data->password) < 6) apiError("Password must be at least 6 characters");
        $fields[] = "password = :password";
        $params[":password"] = password_hash($data->password, PASSWORD_DEFAULT);
    }

    if (empty($fields)) apiError("No fields to update");

    $stmt = $conn->prepare("UPDATE user SET " . implode(', ', $fields) . " WHERE id = :id");
    $stmt->execute($params);

    $stmt = $conn->prepare("SELECT id, username, full_name, role, profile_image FROM user WHERE id = :id");
    $stmt->bindParam(":id", $userId);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    apiSuccess(["message" => "Profile updated", "user" => $user]);
} catch (PDOException $e) { handleDbError($e); }
