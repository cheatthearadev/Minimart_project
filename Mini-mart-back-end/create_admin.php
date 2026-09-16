<?php
include_once __DIR__ . '/config/database.php';
include_once __DIR__ . '/config/dotenv.php';

$username = 'admin';
$password = getenv('ADMIN_PASSWORD') ?: '';
if (empty($password)) {
    echo "Error: ADMIN_PASSWORD not set in .env";
    exit;
}
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare("UPDATE user SET password = :password WHERE username = :username");
$stmt->bindParam(":password", $hashedPassword);
$stmt->bindParam(":username", $username);

if ($stmt->execute()) {
    echo "Admin password reset successfully!<br>";
    echo "Username: admin<br>";
} else {
    echo "Failed to reset password.";
}
?>
