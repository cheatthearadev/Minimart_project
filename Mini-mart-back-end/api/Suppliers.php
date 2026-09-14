<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/helpers.php';

try {
    $stmt = $conn->prepare("SELECT s.*, (SELECT COUNT(*) FROM products WHERE supplier_id = s.id) as product_count FROM suppliers s ORDER BY s.id ASC");
    $stmt->execute();
    apiSuccess($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) { handleDbError($e); }
