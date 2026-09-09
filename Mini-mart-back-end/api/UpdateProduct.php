<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once __DIR__ . '/../config/database.php';
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id) && !empty($data->barcode) && !empty($data->name) && !empty($data->price) && isset($data->stock)) {
    try {
        $image = $data->image ?? null;
        $category_id = $data->category_id ?? null;
        $supplier_id = $data->supplier_id ?? null;
        $unit = $data->unit ?? 'piece';
        $cost_price = $data->cost_price ?? 0;

        $query = "UPDATE products SET barcode = :barcode, name = :name, price = :price, stock = :stock, image = :image, category_id = :category_id, supplier_id = :supplier_id, unit = :unit, cost_price = :cost_price WHERE id = :id";
        $stmt = $conn->prepare($query);

        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":barcode", $data->barcode);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":price", $data->price);
        $stmt->bindParam(":stock", $data->stock);
        $stmt->bindParam(":image", $image);
        $stmt->bindParam(":category_id", $category_id);
        $stmt->bindParam(":supplier_id", $supplier_id);
        $stmt->bindParam(":unit", $unit);
        $stmt->bindParam(":cost_price", $cost_price);

        if ($stmt->execute()) {
            echo json_encode(["message" => "Product updated."]);
        } else {
            echo json_encode(["error" => "Unable to update product."]);
        }
    } catch (PDOException $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
} else {
    echo json_encode(["error" => "Data incomplete."]);
}
