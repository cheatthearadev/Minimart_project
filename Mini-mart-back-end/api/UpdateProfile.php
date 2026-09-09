<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
include_once __DIR__ . '/../config/database.php';

$data = json_decode(file_get_contents("php://input"));
if (empty($data->id)) { echo json_encode(["error" => "User ID required"]); exit(); }

try {
    $fields = []; $params = [":id" => $data->id];

    if (!empty($data->full_name)) {
        $fields[] = "full_name = :full_name";
        $params[":full_name"] = $data->full_name;
    }
    if (isset($data->profile_image)) {
        $fields[] = "profile_image = :profile_image";
        $params[":profile_image"] = $data->profile_image;
    }
    if (!empty($data->password)) {
        $fields[] = "password = :password";
        $params[":password"] = password_hash($data->password, PASSWORD_DEFAULT);
    }

    if (empty($fields)) {
        echo json_encode(["error" => "No fields to update"]);
        exit();
    }

    $stmt = $conn->prepare("UPDATE user SET " . implode(', ', $fields) . " WHERE id = :id");
    $stmt->execute($params);

    $stmt = $conn->prepare("SELECT id, username, full_name, role, profile_image FROM user WHERE id = :id");
    $stmt->bindParam(":id", $data->id);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(["message" => "Profile updated", "user" => $user]);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
