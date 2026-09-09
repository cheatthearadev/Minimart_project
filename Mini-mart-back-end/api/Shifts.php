<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__ . '/../config/database.php';
try {
    $stmt = $conn->prepare("SELECT s.*, u.username FROM shifts s JOIN user u ON s.user_id = u.id ORDER BY s.start_time DESC LIMIT 50");
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) { echo json_encode(["error" => $e->getMessage()]); }
