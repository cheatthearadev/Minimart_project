<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
include_once __DIR__ . '/../config/database.php';
$data = json_decode(file_get_contents("php://input"));
if (empty($data->order_id) || empty($data->product_id) || empty($data->quantity) || !isset($data->refund_amount)) {
    echo json_encode(["error" => "All fields are required"]); exit();
}
try {
    $conn->beginTransaction();
    $reason = $data->reason ?? null;
    $processed_by = $data->processed_by ?? null;
    $stmt = $conn->prepare("INSERT INTO returns (order_id, product_id, quantity, reason, refund_amount, processed_by) VALUES (:order_id, :product_id, :quantity, :reason, :refund_amount, :processed_by)");
    $stmt->bindParam(":order_id", $data->order_id);
    $stmt->bindParam(":product_id", $data->product_id);
    $stmt->bindParam(":quantity", $data->quantity);
    $stmt->bindParam(":reason", $reason);
    $stmt->bindParam(":refund_amount", $data->refund_amount);
    $stmt->bindParam(":processed_by", $processed_by);
    $stmt->execute();
    $stmt = $conn->prepare("UPDATE products SET stock = stock + :qty WHERE id = :id");
    $stmt->bindParam(":qty", $data->quantity);
    $stmt->bindParam(":id", $data->product_id);
    $stmt->execute();
    $stmt = $conn->prepare("INSERT INTO inventory_log (product_id, type, quantity_change, note) VALUES (:pid, 'return', :qty, :note)");
    $stmt->bindParam(":pid", $data->product_id);
    $stmt->bindParam(":qty", $data->quantity);
    $note_val = "Return from order #" . $data->order_id;
    $stmt->bindParam(":note", $note_val);
    $stmt->execute();
    $conn->commit();
    echo json_encode(["message" => "Return processed", "id" => $conn->lastInsertId()]);
} catch (PDOException $e) { $conn->rollBack(); echo json_encode(["error" => $e->getMessage()]); }
