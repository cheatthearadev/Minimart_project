<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAuth();

$data = json_decode(file_get_contents("php://input"));
validateRequired($data, ['id', 'barcode', 'name', 'price', 'stock']);
validatePositiveNumber($data->price, 'Price');
validatePositiveNumber($data->stock, 'Stock');

try {
    $image = sanitizeString($data->image ?? null);
    $category_id = $data->category_id ?? null;
    $supplier_id = $data->supplier_id ?? null;
    $unit = sanitizeString($data->unit ?? 'piece');
    $cost_price = floatval($data->cost_price ?? 0);

    $query = "UPDATE products SET barcode = :barcode, name = :name, price = :price, stock = :stock, image = :image, category_id = :category_id, supplier_id = :supplier_id, unit = :unit, cost_price = :cost_price WHERE id = :id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":id", $data->id);
    $stmt->bindParam(":barcode", sanitizeString($data->barcode));
    $stmt->bindParam(":name", sanitizeString($data->name));
    $stmt->bindParam(":price", $data->price);
    $stmt->bindParam(":stock", $data->stock);
    $stmt->bindParam(":image", $image);
    $stmt->bindParam(":category_id", $category_id);
    $stmt->bindParam(":supplier_id", $supplier_id);
    $stmt->bindParam(":unit", $unit);
    $stmt->bindParam(":cost_price", $cost_price);

    if ($stmt->execute()) {
        apiSuccess(["message" => "Product updated"]);
    } else {
        apiError("Unable to update product", 500);
    }
} catch (PDOException $e) { handleDbError($e); }
