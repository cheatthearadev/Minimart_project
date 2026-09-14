<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') JWT::requireAuth();

try {
    switch ($method) {
        case 'GET':
            $stmt = $conn->prepare("SELECT * FROM coupons ORDER BY created_at DESC");
            $stmt->execute();
            apiSuccess($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            validateRequired($data, ['code', 'type', 'value']);
            $type = $data->type;
            $valid_types = ['percentage', 'fixed'];
            if (!in_array($type, $valid_types)) apiError("Type must be 'percentage' or 'fixed'");
            $min_order_amount = isset($data->min_order_amount) && $data->min_order_amount !== '' ? $data->min_order_amount : null;
            $max_uses = isset($data->max_uses) && $data->max_uses !== '' ? $data->max_uses : null;
            $expires_at = isset($data->expires_at) && $data->expires_at !== '' ? $data->expires_at : null;
            $is_active = isset($data->is_active) ? (intval($data->is_active) ? 1 : 0) : 1;
            $stmt = $conn->prepare("INSERT INTO coupons (code, type, value, min_order_amount, max_uses, used_count, expires_at, is_active) VALUES (:code, :type, :value, :min_order_amount, :max_uses, 0, :expires_at, :is_active)");
            $stmt->bindParam(":code", sanitizeString($data->code));
            $stmt->bindParam(":type", $type);
            $stmt->bindParam(":value", $data->value);
            $stmt->bindParam(":min_order_amount", $min_order_amount);
            $stmt->bindParam(":max_uses", $max_uses);
            $stmt->bindParam(":expires_at", $expires_at);
            $stmt->bindParam(":is_active", $is_active);
            $stmt->execute();
            apiSuccess(["message" => "Coupon created", "id" => $conn->lastInsertId()]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->id)) apiError("ID required");
            $fields = [];
            $params = [":id" => $data->id];
            foreach (['code','type','value','min_order_amount','max_uses','expires_at','is_active'] as $f) {
                if (isset($data->$f)) { $fields[] = "$f = :$f"; $params[":$f"] = $data->$f; }
            }
            if (empty($fields)) apiError("No fields to update");
            $stmt = $conn->prepare("UPDATE coupons SET " . implode(', ', $fields) . " WHERE id = :id");
            $stmt->execute($params);
            apiSuccess(["message" => "Coupon updated"]);
            break;

        case 'DELETE':
            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->id)) apiError("ID required");
            $stmt = $conn->prepare("DELETE FROM coupons WHERE id = :id");
            $stmt->bindParam(":id", $data->id);
            $stmt->execute();
            apiSuccess(["message" => "Coupon deleted"]);
            break;

        default:
            apiError("Method not allowed", 405);
            break;
    }
} catch (PDOException $e) {
    handleDbError($e);
}
