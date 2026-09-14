<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/helpers.php';

$status_filter = isset($_GET['status']) ? $_GET['status'] : null;

try {
    $sql = "SELECT d.*, o.invoice_number, o.total_amount, o.created_at as order_date
            FROM deliveries d
            JOIN orders o ON d.order_id = o.id";

    $params = [];
    if ($status_filter && $status_filter !== 'all') {
        $sql .= " WHERE d.status = :status";
        $params[':status'] = $status_filter;
    }

    $sql .= " ORDER BY d.created_at DESC";

    $stmt = $conn->prepare($sql);
    foreach ($params as $k => $v) $stmt->bindParam($k, $v);
    $stmt->execute();
    $deliveries = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $orderIds = array_column($deliveries, 'order_id');
    if (!empty($orderIds)) {
        $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
        $itemStmt = $conn->prepare("
            SELECT oi.*, p.name, p.barcode
            FROM order_item oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id IN ($placeholders)
        ");
        foreach ($orderIds as $i => $id) {
            $itemStmt->bindValue($i + 1, $id);
        }
        $itemStmt->execute();
        $allItems = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

        $itemsByOrder = [];
        foreach ($allItems as $item) {
            $itemsByOrder[$item['order_id']][] = $item;
        }

        foreach ($deliveries as &$delivery) {
            $delivery['items'] = $itemsByOrder[$delivery['order_id']] ?? [];
        }
    }

    apiSuccess($deliveries);
} catch (PDOException $e) {
    handleDbError($e);
}
