<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/helpers.php';

try {
    $stmt = $conn->prepare("SELECT r.*, p.name as product_name, o.invoice_number, u.username as processed_by_name FROM returns r JOIN products p ON r.product_id = p.id JOIN orders o ON r.order_id = o.id LEFT JOIN user u ON r.processed_by = u.id ORDER BY r.created_at DESC");
    $stmt->execute();
    apiSuccess($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) { handleDbError($e); }
