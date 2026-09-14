<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/helpers.php';

try {
    $stmt = $conn->prepare("SELECT * FROM orders ORDER BY created_at DESC");
    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $orderIds = array_column($orders, 'id');

    if (!empty($orderIds)) {
        $placeholders = implode(',', array_fill(0, count($orderIds), '?'));

        $itemStmt = $conn->prepare("
            SELECT oi.*, p.name, p.barcode
            FROM order_item oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id IN ($placeholders)
        ");
        foreach ($orderIds as $i => $id) {
            $itemStmt->bindValue($i + 1, $id, PDO::PARAM_INT);
        }
        $itemStmt->execute();
        $allItems = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

        $itemsByOrder = [];
        foreach ($allItems as $item) {
            $itemsByOrder[$item['order_id']][] = $item;
        }

        $deliveryOrderIds = [];
        foreach ($orders as $o) {
            if (isset($o['order_type']) && $o['order_type'] === 'delivery') {
                $deliveryOrderIds[] = $o['id'];
            }
        }

        $deliveriesByOrder = [];
        if (!empty($deliveryOrderIds)) {
            $delPlaceholders = implode(',', array_fill(0, count($deliveryOrderIds), '?'));
            $delStmt = $conn->prepare("SELECT * FROM deliveries WHERE order_id IN ($delPlaceholders)");
            foreach ($deliveryOrderIds as $i => $id) {
                $delStmt->bindValue($i + 1, $id, PDO::PARAM_INT);
            }
            $delStmt->execute();
            $allDeliveries = $delStmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($allDeliveries as $d) {
                $deliveriesByOrder[$d['order_id']] = $d;
            }
        }

        foreach ($orders as &$order) {
            $order['items'] = $itemsByOrder[$order['id']] ?? [];
            $order['delivery'] = $deliveriesByOrder[$order['id']] ?? null;
        }
        unset($order);
    }

    apiSuccess($orders);
} catch (PDOException $e) {
    handleDbError($e);
}
