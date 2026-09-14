<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAuth();

$data = json_decode(file_get_contents("php://input"));
validateRequired($data, ['order_id', 'product_id', 'quantity', 'refund_amount']);
validatePositiveNumber($data->refund_amount, 'Refund amount');

try {
    $conn->beginTransaction();
    $reason = sanitizeString($data->reason ?? null);
    $processed_by = JWT::getUserIdFromRequest();
    $stmt = $conn->prepare("INSERT INTO returns (order_id, product_id, quantity, reason, refund_amount, processed_by) VALUES (:order_id, :product_id, :quantity, :reason, :refund_amount, :processed_by)");
    $stmt->bindParam(":order_id", $data->order_id);
    $stmt->bindParam(":product_id", $data->product_id);
    $stmt->bindParam(":quantity", intval($data->quantity));
    $stmt->bindParam(":reason", $reason);
    $stmt->bindParam(":refund_amount", $data->refund_amount);
    $stmt->bindParam(":processed_by", $processed_by);
    $stmt->execute();
    $stmt = $conn->prepare("UPDATE products SET stock = stock + :qty WHERE id = :id");
    $stmt->bindParam(":qty", intval($data->quantity));
    $stmt->bindParam(":id", $data->product_id);
    $stmt->execute();
    $stmt = $conn->prepare("INSERT INTO inventory_log (product_id, type, quantity_change, note) VALUES (:pid, 'return', :qty, :note)");
    $stmt->bindParam(":pid", $data->product_id);
    $stmt->bindParam(":qty", intval($data->quantity));
    $note_val = "Return from order #" . $data->order_id;
    $stmt->bindParam(":note", $note_val);
    $stmt->execute();
    $conn->commit();
    apiSuccess(["message" => "Return processed", "id" => $conn->lastInsertId()]);
} catch (PDOException $e) { $conn->rollBack(); handleDbError($e); }
