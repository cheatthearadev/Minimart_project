<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/helpers.php';

try {
    $stmt = $conn->prepare("SELECT s.*, u.username FROM shifts s JOIN user u ON s.user_id = u.id ORDER BY s.start_time DESC LIMIT 50");
    $stmt->execute();
    apiSuccess($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) { handleDbError($e); }
