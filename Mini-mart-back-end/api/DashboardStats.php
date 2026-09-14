<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/helpers.php';

try {
    $stmt = $conn->prepare("SELECT COUNT(*) as orders, COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE DATE(created_at) = CURDATE()");
    $stmt->execute();
    $today = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("SELECT COUNT(*) as orders, COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE YEARWEEK(created_at,1) = YEARWEEK(CURDATE(),1)");
    $stmt->execute();
    $week = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("SELECT COUNT(*) as orders, COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE MONTH(created_at)=MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE())");
    $stmt->execute();
    $month = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("SELECT COUNT(*) as total, SUM(CASE WHEN stock < low_stock_threshold AND stock > 0 THEN 1 ELSE 0 END) as low_stock, SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock, COALESCE(SUM(price * stock),0) as stock_value FROM products");
    $stmt->execute();
    $products = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("SELECT id, name, stock, low_stock_threshold, image FROM products WHERE stock < low_stock_threshold AND stock > 0 ORDER BY stock ASC LIMIT 10");
    $stmt->execute();
    $lowStockProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("SELECT DATE(created_at) as date, SUM(total_amount) as revenue, COUNT(*) as orders FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) GROUP BY DATE(created_at) ORDER BY date ASC");
    $stmt->execute();
    $chart = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("SELECT p.name, SUM(oi.quantity) as total_sales, SUM(oi.price * oi.quantity) as revenue FROM order_item oi JOIN products p ON oi.product_id = p.id JOIN orders o ON oi.order_id = o.id WHERE DATE(o.created_at) = CURDATE() GROUP BY p.id ORDER BY revenue DESC LIMIT 5");
    $stmt->execute();
    $topProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("SELECT DATE_FORMAT(created_at, '%a') as day, COUNT(*) as orders, COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE YEARWEEK(created_at,1) = YEARWEEK(CURDATE(),1) GROUP BY DATE(created_at), DATE_FORMAT(created_at, '%a') ORDER BY DATE(created_at) ASC");
    $stmt->execute();
    $weeklyRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $weekMap = [];
    foreach ($weeklyRows as $row) {
        $weekMap[$row['day']] = $row;
    }
    $dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    $weeklySummary = [];
    foreach ($dayOrder as $day) {
        if (isset($weekMap[$day])) {
            $weeklySummary[] = $weekMap[$day];
        } else {
            $weeklySummary[] = ['day' => $day, 'orders' => 0, 'revenue' => 0];
        }
    }

    apiSuccess([
        "total_products" => $products['total'] ?? 0,
        "stock_value" => $products['stock_value'] ?? 0,
        "low_stock" => $products['low_stock'] ?? 0,
        "out_of_stock" => $products['out_of_stock'] ?? 0,
        "low_stock_products" => $lowStockProducts,
        "today_orders" => $today['orders'] ?? 0,
        "today_revenue" => $today['revenue'] ?? 0,
        "revenue_chart" => $chart,
        "top_products" => $topProducts,
        "weekly_summary" => $weeklySummary,
        "monthly_summary" => $month
    ]);
} catch (PDOException $e) {
    handleDbError($e);
}
