<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
include_once __DIR__ . '/../config/database.php';
$data = json_decode(file_get_contents("php://input"));
if (empty($data->csv)) { echo json_encode(["error" => "CSV data required"]); exit(); }
try {
    $lines = explode("\n", trim($data->csv));
    $imported = 0; $errors = [];
    array_shift($lines);
    foreach ($lines as $i => $line) {
        $line = trim($line);
        if (empty($line)) continue;
        $cols = str_getcsv($line);
        if (count($cols) < 4) { $errors[] = "Line " . ($i+2) . ": insufficient columns"; continue; }
        list($barcode, $name, $price, $stock) = $cols;
        $unit = $cols[4] ?? 'piece';
        $cost_price = $cols[5] ?? 0;
        $category_id = $cols[6] ?? null;
        $stmt = $conn->prepare("INSERT INTO products (barcode, name, price, stock, unit, cost_price, category_id) VALUES (:barcode, :name, :price, :stock, :unit, :cost_price, :category_id)");
        $stmt->bindParam(":barcode", $barcode);
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":price", floatval($price));
        $stmt->bindParam(":stock", intval($stock));
        $stmt->bindParam(":unit", $unit);
        $stmt->bindParam(":cost_price", floatval($cost_price));
        $catId = !empty($category_id) ? intval($category_id) : null;
        $stmt->bindParam(":category_id", $catId);
        $stmt->execute();
        $imported++;
    }
    echo json_encode(["message" => "Imported $imported products", "imported" => $imported, "errors" => $errors]);
} catch (PDOException $e) { echo json_encode(["error" => $e->getMessage()]); }
