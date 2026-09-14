<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/helpers.php';

try {
    $stmt = $conn->prepare("SELECT * FROM customers ORDER BY id ASC");
    $stmt->execute();
    apiSuccess($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) { handleDbError($e); }
