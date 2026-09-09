<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $stmt = $conn->prepare("SELECT * FROM coupons ORDER BY created_at DESC");
            $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->code) || empty($data->type) || !isset($data->value) || $data->value === '') {
                echo json_encode(["error" => "Code, type and value are required"]);
                exit();
            }
            $type = $data->type;
            $valid_types = ['percentage', 'fixed'];
            if (!in_array($type, $valid_types)) {
                echo json_encode(["error" => "Type must be 'percentage' or 'fixed'"]);
                exit();
            }
            $min_order_amount = isset($data->min_order_amount) && $data->min_order_amount !== '' ? $data->min_order_amount : null;
            $max_uses = isset($data->max_uses) && $data->max_uses !== '' ? $data->max_uses : null;
            $expires_at = isset($data->expires_at) && $data->expires_at !== '' ? $data->expires_at : null;
            $is_active = isset($data->is_active) ? (intval($data->is_active) ? 1 : 0) : 1;
            $stmt = $conn->prepare("INSERT INTO coupons (code, type, value, min_order_amount, max_uses, used_count, expires_at, is_active) VALUES (:code, :type, :value, :min_order_amount, :max_uses, 0, :expires_at, :is_active)");
            $stmt->bindParam(":code", $data->code);
            $stmt->bindParam(":type", $type);
            $stmt->bindParam(":value", $data->value);
            $stmt->bindParam(":min_order_amount", $min_order_amount);
            $stmt->bindParam(":max_uses", $max_uses);
            $stmt->bindParam(":expires_at", $expires_at);
            $stmt->bindParam(":is_active", $is_active);
            $stmt->execute();
            echo json_encode(["message" => "Coupon created", "id" => $conn->lastInsertId()]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->id)) {
                echo json_encode(["error" => "ID required"]);
                exit();
            }
            $fields = [];
            $params = [":id" => $data->id];
            foreach (['code','type','value','min_order_amount','max_uses','expires_at','is_active'] as $f) {
                if (isset($data->$f)) {
                    $fields[] = "$f = :$f";
                    $params[":$f"] = $data->$f;
                }
            }
            if (empty($fields)) {
                echo json_encode(["error" => "No fields to update"]);
                exit();
            }
            $stmt = $conn->prepare("UPDATE coupons SET " . implode(', ', $fields) . " WHERE id = :id");
            $stmt->execute($params);
            echo json_encode(["message" => "Coupon updated"]);
            break;

        case 'DELETE':
            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->id)) {
                echo json_encode(["error" => "ID required"]);
                exit();
            }
            $stmt = $conn->prepare("DELETE FROM coupons WHERE id = :id");
            $stmt->bindParam(":id", $data->id);
            $stmt->execute();
            echo json_encode(["message" => "Coupon deleted"]);
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Method not allowed"]);
            break;
    }
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}