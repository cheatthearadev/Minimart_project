<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/helpers.php';

try {
    $stmt = $conn->prepare("SELECT * FROM discounts ORDER BY created_at DESC");
    $stmt->execute();
    apiSuccess($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) { handleDbError($e); }
