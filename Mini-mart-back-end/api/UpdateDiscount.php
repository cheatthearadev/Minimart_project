<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAuth();

$data = json_decode(file_get_contents("php://input"));
if (empty($data->id)) apiError("ID required");

try {
    $fields = [];
    $params = [":id" => $data->id];
    foreach (['code','type','value','min_order','max_uses','start_date','end_date','active'] as $f) {
        if (isset($data->$f)) { $fields[] = "$f = :$f"; $params[":$f"] = $data->$f; }
    }
    if (empty($fields)) apiError("No fields to update");
    $stmt = $conn->prepare("UPDATE discounts SET " . implode(', ', $fields) . " WHERE id = :id");
    $stmt->execute($params);
    apiSuccess(["message" => "Discount updated"]);
} catch (PDOException $e) { handleDbError($e); }
