<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

$userId = JWT::requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') apiError("Method not allowed", 405);

$data = json_decode(file_get_contents("php://input"));
if (empty($data->order_id)) apiError("Order ID is required");

try {
    $conn->beginTransaction();

    $stmt = $conn->prepare("SELECT * FROM orders WHERE id = :id LIMIT 1");
    $stmt->bindParam(":id", $data->order_id);
    $stmt->execute();
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        $conn->rollBack();
        apiError("Order not found", 404);
    }

    if ($order['status'] === 'voided') {
        $conn->rollBack();
        apiError("Order is already voided");
    }

    $stmt = $conn->prepare("UPDATE orders SET status = 'voided' WHERE id = :id");
    $stmt->bindParam(":id", $data->order_id);
    $stmt->execute();

    $stmt = $conn->prepare("SELECT product_id, quantity FROM order_item WHERE order_id = :order_id");
    $stmt->bindParam(":order_id", $data->order_id);
    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($items as $item) {
        $stmt = $conn->prepare("UPDATE products SET stock = stock + :qty WHERE id = :id");
        $stmt->bindParam(":qty", $item['quantity']);
        $stmt->bindParam(":id", $item['product_id']);
        $stmt->execute();

        $stmt = $conn->prepare("INSERT INTO inventory_log (product_id, type, quantity_change, note) VALUES (:pid, 'void', :qty, :note)");
        $stmt->bindParam(":pid", $item['product_id']);
        $stmt->bindParam(":qty", $item['quantity']);
        $note = "Order #" . $data->order_id . " voided";
        $stmt->bindParam(":note", $note);
        $stmt->execute();
    }

    if (!empty($order['customer_id']) && $order['total_amount'] > 0) {
        $stmt = $conn->prepare("UPDATE customers SET points = points - :points, total_spent = total_spent - :spent WHERE id = :id AND points >= :points2 AND total_spent >= :spent2");
        $points = intval($order['total_amount']);
        $spent = floatval($order['total_amount']);
        $stmt->bindParam(":points", $points);
        $stmt->bindParam(":spent", $spent);
        $stmt->bindParam(":id", $order['customer_id']);
        $stmt->bindParam(":points2", $points);
        $stmt->bindParam(":spent2", $spent);
        $stmt->execute();
    }

    $conn->commit();

    apiSuccess(["message" => "Order #" . $data->order_id . " has been voided and stock restored"]);

} catch (PDOException $e) {
    $conn->rollBack();
    handleDbError($e);
}
