<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
include_once __DIR__ . '/../config/database.php';
$data = json_decode(file_get_contents("php://input"));
if (empty($data->id) || empty($data->name)) { echo json_encode(["error" => "ID and name are required"]); exit(); }
try {
    $color = isset($data->color) ? $data->color : '#6366f1';
    $desc = isset($data->description) ? $data->description : null;
    $stmt = $conn->prepare("UPDATE categories SET name=:name, description=:description, color=:color WHERE id=:id");
    $stmt->bindParam(":id", $data->id);
    $stmt->bindParam(":name", $data->name);
    $stmt->bindParam(":description", $desc);
    $stmt->bindParam(":color", $color);
    $stmt->execute();
    echo json_encode(["message" => "Category updated"]);
} catch (PDOException $e) { echo json_encode(["error" => $e->getMessage()]); }
