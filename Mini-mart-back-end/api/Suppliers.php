<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__ . '/../config/database.php';
try {
    $stmt = $conn->prepare("SELECT s.*, COUNT(p.id) as product_count FROM suppliers s LEFT JOIN products p ON s.id = p.supplier_id GROUP BY s.id ORDER BY s.name ASC");
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) { echo json_encode(["error" => $e->getMessage()]); }
