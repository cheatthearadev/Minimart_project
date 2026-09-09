<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__ . '/../config/database.php';

try {
    $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

    $stmt = $conn->prepare("SELECT COUNT(*) as total_orders, COALESCE(SUM(o.total_amount),0) as total_revenue, COALESCE(SUM(o.cash_received),0) as total_cash, COALESCE(SUM(o.cash_return),0) as total_change, COALESCE(SUM(o.discount_amount),0) as total_discounts, COALESCE(SUM(d.delivery_fee),0) as total_delivery_fees FROM orders o LEFT JOIN deliveries d ON d.order_id = o.id WHERE DATE(o.created_at) = :date AND o.status = 'completed'");
    $stmt->bindParam(":date", $date);
    $stmt->execute();
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("SELECT order_type, COUNT(*) as count, SUM(total_amount) as revenue FROM orders WHERE DATE(created_at) = :date AND status = 'completed' GROUP BY order_type");
    $stmt->bindParam(":date", $date);
    $stmt->execute();
    $byType = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("SELECT u.username as cashier, COUNT(*) as orders, SUM(o.total_amount) as revenue FROM orders o LEFT JOIN user u ON o.user_id = u.id WHERE DATE(o.created_at) = :date AND o.status = 'completed' GROUP BY o.user_id ORDER BY revenue DESC");
    $stmt->bindParam(":date", $date);
    $stmt->execute();
    $byCashier = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("SELECT payment_method, COUNT(*) as count, SUM(amount) as total FROM (SELECT COALESCE(payment_method, CASE WHEN cash_received > 0 THEN 'cash' ELSE 'wing' END) as payment_method, total_amount as amount FROM orders WHERE DATE(created_at) = :date AND status = 'completed') t GROUP BY payment_method");
    $stmt->bindParam(":date", $date);
    $stmt->execute();
    $byPayment = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("SELECT id, starting_cash, ending_cash, total_sales, status, start_time, end_time FROM shifts WHERE DATE(start_time) = :date ORDER BY start_time DESC LIMIT 1");
    $stmt->bindParam(":date", $date);
    $stmt->execute();
    $shift = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "date" => $date,
        "summary" => $summary,
        "by_type" => $byType,
        "by_cashier" => $byCashier,
        "by_payment" => $byPayment,
        "shift" => $shift
    ]);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
