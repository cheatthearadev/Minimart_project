<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAuth();

$data = json_decode(file_get_contents("php://input"));
if (empty($data->shift_id)) apiError("Shift ID required");

try {
    $ending_cash = floatval($data->ending_cash ?? 0);
    $stmt = $conn->prepare("SELECT s.start_time, COALESCE(SUM(o.total_amount),0) as total_sales FROM shifts s LEFT JOIN orders o ON o.created_at >= s.start_time AND o.created_at <= NOW() WHERE s.id = :sid");
    $stmt->bindParam(":sid", $data->shift_id);
    $stmt->execute();
    $shiftData = $stmt->fetch(PDO::FETCH_ASSOC);
    $total_sales = $shiftData['total_sales'] ?? 0;
    $stmt = $conn->prepare("UPDATE shifts SET end_time = NOW(), ending_cash = :ec, total_sales = :ts, status = 'closed' WHERE id = :id AND status = 'active'");
    $stmt->bindParam(":ec", $ending_cash);
    $stmt->bindParam(":ts", $total_sales);
    $stmt->bindParam(":id", $data->shift_id);
    $stmt->execute();
    apiSuccess(["message" => "Shift closed", "total_sales" => $total_sales]);
} catch (PDOException $e) { handleDbError($e); }
