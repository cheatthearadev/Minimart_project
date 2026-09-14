<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

include_once __DIR__ . '/../controllers/Authcontroller.php';

$data = json_decode(file_get_contents("php://input"));

if (empty($data->credential)) apiError("Token is required");

$googleToken = $data->credential;
$url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . $googleToken;
$response = @file_get_contents($url);

if ($response === FALSE) apiError("Unable to verify Google token", 401);

$payload = json_decode($response, true);

if (isset($payload['error_description']) || empty($payload['email'])) apiError("Invalid Google Token", 401);

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

    $token = JWT::encode([
        'user_id' => $user['id'],
        'username' => $user['username'],
        'role' => $user['role']
    ]);

    apiSuccess([
        "message" => "Login successful",
        "token" => $token,
        "user" => $user
    ]);

} catch (PDOException $e) {
    handleDbError($e);
}
