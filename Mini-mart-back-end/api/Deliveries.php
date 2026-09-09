<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

include_once __DIR__ . '/../config/database.php';

$status_filter = isset($_GET['status']) ? $_GET['status'] : null;

try {
    $sql = "SELECT d.*, o.invoice_number, o.total_amount, o.created_at as order_date
            FROM deliveries d
            JOIN orders o ON d.order_id = o.id";

    if ($status_filter && $status_filter !== 'all') {
        $sql .= " WHERE d.status = :status";
    }

    $sql .= " ORDER BY d.created_at DESC";

    $stmt = $conn->prepare($sql);

    if ($status_filter && $status_filter !== 'all') {
        $stmt->bindParam(":status", $status_filter);
    }

    $stmt->execute();
    $deliveries = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($deliveries as &$delivery) {
        $stmt2 = $conn->prepare("
            SELECT oi.*, p.name, p.barcode
            FROM order_item oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = :order_id
        ");
        $stmt2->bindParam(":order_id", $delivery['order_id']);
        $stmt2->execute();
        $delivery['items'] = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode($deliveries);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
