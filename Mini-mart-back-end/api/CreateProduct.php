<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') apiError("Method not allowed", 405);

$data = json_decode(file_get_contents("php://input"));
validateRequired($data, ['name', 'price', 'stock']);
validatePositiveNumber($data->price, 'Price');
validatePositiveNumber($data->stock, 'Stock');
validatePositiveNumber($data->cost_price, 'Cost price');

try {
    $image = sanitizeString($data->image ?? null);
    $barcode = sanitizeString($data->barcode ?? null);
    $name = sanitizeString($data->name);
    $category_id = $data->category_id ?? null;
    $supplier_id = $data->supplier_id ?? null;
    $unit = sanitizeString($data->unit ?? 'piece');
    $cost_price = floatval($data->cost_price ?? 0);

    $query = "INSERT INTO products (barcode, name, price, stock, image, category_id, supplier_id, unit, cost_price) VALUES (:barcode, :name, :price, :stock, :image, :category_id, :supplier_id, :unit, :cost_price)";
    $stmt = $conn->prepare($query);

    $stmt->bindParam(":barcode", $barcode);
    $stmt->bindParam(":name", $name);
    $stmt->bindParam(":price", $data->price);
    $stmt->bindParam(":stock", $data->stock);
    $stmt->bindParam(":image", $image);
    $stmt->bindParam(":category_id", $category_id);
    $stmt->bindParam(":supplier_id", $supplier_id);
    $stmt->bindParam(":unit", $unit);
    $stmt->bindParam(":cost_price", $cost_price);

    if ($stmt->execute()) {
        apiSuccess(["message" => "Product created successfully"]);
    } else {
        apiError("Unable to create product", 500);
    }
} catch (PDOException $e) {
    handleDbError($e);
}
