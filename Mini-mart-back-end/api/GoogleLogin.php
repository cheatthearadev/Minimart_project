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

if (empty($data->credential)) {
    echo json_encode(["success" => false, "error" => "Token is required"]);
    exit();
}

// ផ្ទៀងផ្ទាត់ Token ជាមួយ Google
$googleToken = $data->credential;
$url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . $googleToken;
$response = @file_get_contents($url);

if ($response === FALSE) {
    echo json_encode(["success" => false, "error" => "Unable to verify Google token"]);
    exit();
}

$payload = json_decode($response, true);

if (isset($payload['error_description']) || empty($payload['email'])) {
    echo json_encode(["success" => false, "error" => "Invalid Google Token"]);
    exit();
}

$email = $payload['email'];
$name = $payload['name'] ?? $payload['given_name'];

try {
    $stmt = $conn->prepare("SELECT id, username, full_name, role FROM user WHERE username = :email LIMIT 1");
    $stmt->bindParam(":email", $email);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        $randomPassword = bin2hex(random_bytes(16));
        $hashedPassword = password_hash($randomPassword, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO user (username, password, full_name, role) VALUES (:email, :password, :name, 'cashier')");
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":password", $hashedPassword);
        $stmt->bindParam(":name", $name);
        $stmt->execute();

        $userId = $conn->lastInsertId();
        $user = [
            "id" => $userId,
            "username" => $email,
            "full_name" => $name,
            "role" => "cashier"
        ];
    }

    echo json_encode([
        "success" => true,
        "message" => "Login successful",
        "user" => $user
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}