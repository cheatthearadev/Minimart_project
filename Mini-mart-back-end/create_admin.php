<?php
include_once __DIR__ . '/config/database.php';

$username = 'admin';
$password = 'admin123';
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare("UPDATE user SET password = :password WHERE username = :username");
$stmt->bindParam(":password", $hashedPassword);
$stmt->bindParam(":username", $username);

if ($stmt->execute()) {
    echo "Admin password reset successfully!<br>";
    echo "Username: admin<br>";
    echo "Password: admin123<br>";
} else {
    echo "Failed to reset password.";
}
?>
