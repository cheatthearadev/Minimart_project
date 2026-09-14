<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/helpers.php';

try {
    $query = "SELECT p.*, c.name as category_name, c.color as category_color, s.name as supplier_name, s.phone as supplier_phone FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN suppliers s ON p.supplier_id = s.id ORDER BY p.id DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();

    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    apiSuccess($products);
} catch (PDOException $e) {
    handleDbError($e);
}
