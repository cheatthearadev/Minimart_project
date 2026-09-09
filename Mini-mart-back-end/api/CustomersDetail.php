<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once __DIR__ . '/../config/database.php';

try {
    $customer_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($customer_id <= 0) {
        echo json_encode(["error" => "Invalid customer id"]);
        exit();
    }

    // Fetch the customer (parameterized query - safe against SQL injection).
    $stmt = $conn->prepare("SELECT id, name, phone, email, points, total_spent, loyalty_tier, created_at FROM customers WHERE id = :id LIMIT 1");
    $stmt->bindParam(":id", $customer_id, PDO::PARAM_INT);
    $stmt->execute();
    $customer = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$customer) {
        http_response_code(404);
        echo json_encode(["error" => "Customer not found"]);
        exit();
    }

    // Pagination params for the order history.
    $per_page = isset($_GET['per_page']) ? intval($_GET['per_page']) : 10;
    if ($per_page < 1) { $per_page = 10; }
    if ($per_page > 100) { $per_page = 100; }
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    if ($page < 1) { $page = 1; }

    $offset = ($page - 1) * $per_page;

    // Total number of orders for this customer.
    $stmt = $conn->prepare("SELECT COUNT(*) AS total FROM orders WHERE customer_id = :customer_id");
    $stmt->bindParam(":customer_id", $customer_id, PDO::PARAM_INT);
    $stmt->execute();
    $total_orders = intval($stmt->fetch(PDO::FETCH_ASSOC)['total']);

    $total_pages = $per_page > 0 ? intval(ceil($total_orders / $per_page)) : 1;

    // Paginated order history, latest first.
    $stmt = $conn->prepare(
        "SELECT id, invoice_number, order_type, total_amount, subtotal, discount_amount, cash_received, cash_return, payment_method, status, created_at
         FROM orders
         WHERE customer_id = :customer_id
         ORDER BY created_at DESC, id DESC
         LIMIT :offset, :per_page"
    );
    $stmt->bindParam(":customer_id", $customer_id, PDO::PARAM_INT);
    $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
    $stmt->bindParam(":per_page", $per_page, PDO::PARAM_INT);
    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Attach line items + product names for each order.
    foreach ($orders as &$order) {
        $stmt = $conn->prepare(
            "SELECT oi.*, p.name, p.barcode
             FROM order_item oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = :order_id
             ORDER BY oi.id ASC"
        );
        $stmt->bindParam(":order_id", $order['id'], PDO::PARAM_INT);
        $stmt->execute();
        $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    unset($order);

    echo json_encode([
        "customer" => $customer,
        "orders" => $orders,
        "pagination" => [
            "page" => $page,
            "per_page" => $per_page,
            "total" => $total_orders,
            "total_pages" => $total_pages
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
