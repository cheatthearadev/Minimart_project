<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAuth();

$data = json_decode(file_get_contents("php://input"));
if (empty($data->csv")) apiError("CSV data required");

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
        $sBarcode = sanitizeString($barcode);
        $sName = sanitizeString($name);
        $sUnit = sanitizeString($unit);
        $stmt = $conn->prepare("INSERT INTO products (barcode, name, price, stock, unit, cost_price, category_id) VALUES (:barcode, :name, :price, :stock, :unit, :cost_price, :category_id)");
        $stmt->bindParam(":barcode", $sBarcode);
        $stmt->bindParam(":name", $sName);
        $stmt->bindParam(":price", floatval($price));
        $stmt->bindParam(":stock", intval($stock));
        $stmt->bindParam(":unit", $sUnit);
        $stmt->bindParam(":cost_price", floatval($cost_price));
        $catId = !empty($category_id) ? intval($category_id) : null;
        $stmt->bindParam(":category_id", $catId);
        $stmt->execute();
        $imported++;
    }
    apiSuccess(["message" => "Imported $imported products", "imported" => $imported, "errors" => $errors]);
} catch (PDOException $e) { handleDbError($e); }
