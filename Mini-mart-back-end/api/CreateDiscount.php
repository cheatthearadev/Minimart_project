<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAuth();

$data = json_decode(file_get_contents("php://input"));
validateRequired($data, ['code', 'type', 'value']);

try {
    $min_order = floatval($data->min_order ?? 0);
    $max_uses = intval($data->max_uses ?? 0);
    $start_date = $data->start_date ?? null;
    $end_date = $data->end_date ?? null;
    $stmt = $conn->prepare("INSERT INTO discounts (code, type, value, min_order, max_uses, start_date, end_date) VALUES (:code, :type, :value, :min_order, :max_uses, :start_date, :end_date)");
    $sCode = sanitizeString($data->code);
    $stmt->bindParam(":code", $sCode);
    $stmt->bindParam(":type", $data->type);
    $stmt->bindParam(":value", $data->value);
    $stmt->bindParam(":min_order", $min_order);
    $stmt->bindParam(":max_uses", $max_uses);
    $stmt->bindParam(":start_date", $start_date);
    $stmt->bindParam(":end_date", $end_date);
    $stmt->execute();
    apiSuccess(["message" => "Discount created", "id" => $conn->lastInsertId()]);
} catch (PDOException $e) { handleDbError($e); }
