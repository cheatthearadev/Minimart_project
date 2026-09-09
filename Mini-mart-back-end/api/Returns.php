<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__ . '/../config/database.php';
try {
    $stmt = $conn->prepare("SELECT r.*, p.name as product_name, o.invoice_number, u.username as processed_by_name FROM returns r JOIN products p ON r.product_id = p.id JOIN orders o ON r.order_id = o.id LEFT JOIN user u ON r.processed_by = u.id ORDER BY r.created_at DESC");
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) { echo json_encode(["error" => $e->getMessage()]); }
