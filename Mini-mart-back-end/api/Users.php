<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAuth();

try {
    $stmt = $conn->prepare("SELECT id, username, full_name, role, profile_image FROM user ORDER BY id ASC");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    apiSuccess($users);
} catch (PDOException $e) {
    handleDbError($e);
}
