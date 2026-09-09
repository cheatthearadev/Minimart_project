<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
include_once __DIR__ . '/../config/database.php';
$data = json_decode(file_get_contents("php://input"));
if (empty($data->user_id)) { echo json_encode(["error" => "User ID required"]); exit(); }
try {
    $stmt = $conn->prepare("SELECT id FROM shifts WHERE user_id = :uid AND status = 'active'");
    $stmt->bindParam(":uid", $data->user_id);
    $stmt->execute();
    if ($stmt->fetch()) { echo json_encode(["error" => "User already has an active shift"]); exit(); }
    $cash = $data->starting_cash ?? 0;
    $notes = $data->notes ?? null;
    $stmt = $conn->prepare("INSERT INTO shifts (user_id, start_time, starting_cash, notes, status) VALUES (:uid, NOW(), :cash, :notes, 'active')");
    $stmt->bindParam(":uid", $data->user_id);
    $stmt->bindParam(":cash", $cash);
    $stmt->bindParam(":notes", $notes);
    $stmt->execute();
    echo json_encode(["message" => "Shift started", "id" => $conn->lastInsertId()]);
} catch (PDOException $e) { echo json_encode(["error" => $e->getMessage()]); }
