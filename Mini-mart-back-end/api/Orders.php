<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

include_once __DIR__ . '/../config/database.php';

try {
    $stmt = $conn->prepare("SELECT * FROM orders ORDER BY created_at DESC");
    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($orders as &$order) {
        $stmt = $conn->prepare("
            SELECT oi.*, p.name, p.barcode 
            FROM order_item oi 
            JOIN products p ON oi.product_id = p.id 
            WHERE oi.order_id = :order_id
        ");
        $stmt->bindParam(":order_id", $order['id']);
        $stmt->execute();
        $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (isset($order['order_type']) && $order['order_type'] === 'delivery') {
            $stmt = $conn->prepare("SELECT * FROM deliveries WHERE order_id = :order_id LIMIT 1");
            $stmt->bindParam(":order_id", $order['id']);
            $stmt->execute();
            $delivery = $stmt->fetch(PDO::FETCH_ASSOC);
            $order['delivery'] = $delivery ?: null;
        }
    }

    echo json_encode($orders);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
