<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/helpers.php';

try {
    $customer_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($customer_id <= 0) apiError("Invalid customer id");

    $stmt = $conn->prepare("SELECT id, name, phone, email, points, total_spent, loyalty_tier, created_at FROM customers WHERE id = :id LIMIT 1");
    $stmt->bindParam(":id", $customer_id, PDO::PARAM_INT);
    $stmt->execute();
    $customer = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$customer) apiError("Customer not found", 404);

    $per_page = isset($_GET['per_page']) ? intval($_GET['per_page']) : 10;
    if ($per_page < 1) { $per_page = 10; }
    if ($per_page > 100) { $per_page = 100; }
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    if ($page < 1) { $page = 1; }

    $offset = ($page - 1) * $per_page;

    $stmt = $conn->prepare("SELECT COUNT(*) AS total FROM orders WHERE customer_id = :customer_id");
    $stmt->bindParam(":customer_id", $customer_id, PDO::PARAM_INT);
    $stmt->execute();
    $total_orders = intval($stmt->fetch(PDO::FETCH_ASSOC)['total']);
    $total_pages = $per_page > 0 ? intval(ceil($total_orders / $per_page)) : 1;

    $stmt = $conn->prepare(
        "SELECT id, invoice_number, order_type, total_amount, subtotal, discount_amount, cash_received, cash_return, payment_method, status, created_at
         FROM orders WHERE customer_id = :customer_id ORDER BY created_at DESC, id DESC LIMIT :offset, :per_page"
    );
    $stmt->bindParam(":customer_id", $customer_id, PDO::PARAM_INT);
    $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
    $stmt->bindParam(":per_page", $per_page, PDO::PARAM_INT);
    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $orderIds = array_column($orders, 'id');
    if (!empty($orderIds)) {
        $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
        $itemStmt = $conn->prepare("SELECT oi.*, p.name, p.barcode FROM order_item oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id IN ($placeholders) ORDER BY oi.id ASC");
        foreach ($orderIds as $i => $id) $itemStmt->bindValue($i + 1, $id);
        $itemStmt->execute();
        $allItems = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
        $itemsByOrder = [];
        foreach ($allItems as $item) $itemsByOrder[$item['order_id']][] = $item;
        foreach ($orders as &$order) $order['items'] = $itemsByOrder[$order['id']] ?? [];
    }

    apiSuccess([
        "customer" => $customer,
        "orders" => $orders,
        "pagination" => ["page" => $page, "per_page" => $per_page, "total" => $total_orders, "total_pages" => $total_pages]
    ]);
} catch (PDOException $e) { handleDbError($e); }
