<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Content-Type: application/json; charset=UTF-8");

include_once __DIR__ . '/../config/database.php';

try {
    $query = "SELECT p.*, c.name as category_name, c.color as category_color, s.name as supplier_name, s.phone as supplier_phone FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN suppliers s ON p.supplier_id = s.id ORDER BY p.id DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();

    $products = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $products[] = $row;
    }
    echo json_encode($products);

} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
