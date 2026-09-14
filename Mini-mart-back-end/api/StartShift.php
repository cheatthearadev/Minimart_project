<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

$userId = JWT::requireAuth();

$data = json_decode(file_get_contents("php://input"));

try {
    $stmt = $conn->prepare("SELECT id FROM shifts WHERE user_id = :uid AND status = 'active'");
    $stmt->bindParam(":uid", $userId);
    $stmt->execute();
    if ($stmt->fetch()) apiError("User already has an active shift");

    $cash = floatval($data->starting_cash ?? 0);
    $notes = sanitizeString($data->notes ?? null);
    $stmt = $conn->prepare("INSERT INTO shifts (user_id, start_time, starting_cash, notes, status) VALUES (:uid, NOW(), :cash, :notes, 'active')");
    $stmt->bindParam(":uid", $userId);
    $stmt->bindParam(":cash", $cash);
    $stmt->bindParam(":notes", $notes);
    $stmt->execute();
    apiSuccess(["message" => "Shift started", "id" => $conn->lastInsertId()]);
} catch (PDOException $e) { handleDbError($e); }
