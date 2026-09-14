<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAuth();

$period = $_GET['period'] ?? 'daily';
$from = $_GET['from'] ?? null;
$to = $_GET['to'] ?? null;

try {
    $dateCondition = "";
    $params = [];

    if ($period === 'custom' && $from && $to) {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
            apiError("Invalid date format. Use YYYY-MM-DD");
        }
        $dateCondition = "AND DATE(o.created_at) BETWEEN :from AND :to";
        $params[':from'] = $from;
        $params[':to'] = $to;
    } elseif ($period === 'daily') {
        $dateCondition = "AND DATE(o.created_at) = CURDATE()";
    } elseif ($period === 'weekly') {
        $dateCondition = "AND YEARWEEK(o.created_at, 1) = YEARWEEK(CURDATE(), 1)";
    } elseif ($period === 'monthly') {
        $dateCondition = "AND MONTH(o.created_at) = MONTH(CURDATE()) AND YEAR(o.created_at) = YEAR(CURDATE())";
    }

    $stmt = $conn->prepare("SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount),0) as total_revenue, COALESCE(SUM(cash_received),0) as total_cash, COALESCE(SUM(cash_return),0) as total_return FROM orders o WHERE 1=1 $dateCondition");
    foreach ($params as $k => $v) $stmt->bindParam($k, $v);
    $stmt->execute();
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("SELECT p.name, SUM(oi.quantity) as qty, SUM(oi.price * oi.quantity) as revenue FROM order_item oi JOIN products p ON oi.product_id = p.id JOIN orders o ON oi.order_id = o.id WHERE 1=1 $dateCondition GROUP BY p.id ORDER BY revenue DESC LIMIT 10");
    foreach ($params as $k => $v) $stmt->bindParam($k, $v);
    $stmt->execute();
    $topProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("SELECT DATE(o.created_at) as date, SUM(o.total_amount) as revenue, COUNT(*) as orders FROM orders o WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY DATE(o.created_at) ORDER BY date ASC");
    $stmt->execute();
    $dailyRevenue = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("SELECT HOUR(created_at) as hour, COUNT(*) as orders, SUM(total_amount) as revenue FROM orders WHERE DATE(created_at) = CURDATE() GROUP BY HOUR(created_at) ORDER BY hour ASC");
    $stmt->execute();
    $hourly = $stmt->fetchAll(PDO::FETCH_ASSOC);

    apiSuccess(['summary' => $summary, 'top_products' => $topProducts, 'daily_revenue' => $dailyRevenue, 'hourly_distribution' => $hourly]);
} catch (PDOException $e) {
    handleDbError($e);
}
