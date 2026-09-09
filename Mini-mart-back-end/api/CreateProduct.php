<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Access-Control-Allow-Headers");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once __DIR__ . '/../config/database.php';
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->name) && $data->price !== null && $data->price !== '' && isset($data->stock)) {
    try {
        $image = $data->image ?? null;
        $barcode = $data->barcode ?? null;
        $category_id = $data->category_id ?? null;
        $supplier_id = $data->supplier_id ?? null;
        $unit = $data->unit ?? 'piece';
        $cost_price = $data->cost_price ?? 0;

        $query = "INSERT INTO products (barcode, name, price, stock, image, category_id, supplier_id, unit, cost_price) VALUES (:barcode, :name, :price, :stock, :image, :category_id, :supplier_id, :unit, :cost_price)";
        $stmt = $conn->prepare($query);

        $stmt->bindParam(":barcode", $barcode);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":price", $data->price);
        $stmt->bindParam(":stock", $data->stock);
        $stmt->bindParam(":image", $image);
        $stmt->bindParam(":category_id", $category_id);
        $stmt->bindParam(":supplier_id", $supplier_id);
        $stmt->bindParam(":unit", $unit);
        $stmt->bindParam(":cost_price", $cost_price);

        if ($stmt->execute()) {
            echo json_encode(["message" => "Product was created successfully."]);
        } else {
            echo json_encode(["error" => "Unable to create product."]);
        }
    } catch (PDOException $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
} else {
    echo json_encode(["error" => "Data is incomplete."]);
}
