<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$uploadDir = __DIR__ . '/../uploads/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if (!empty($_FILES['image'])) {
    $file = $_FILES['image'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $maxSize = 5 * 1024 * 1024;

    if (!in_array($file['type'], $allowedTypes)) {
        echo json_encode(["error" => "ត្រូវតែជារូបភាព (JPG, PNG, GIF, WebP)"]);
        exit();
    }

    if ($file['size'] > $maxSize) {
        echo json_encode(["error" => "ទំហំរូបភាពត្រូវតែតូចជាង 5MB"]);
        exit();
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'product_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
    $filepath = $uploadDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        $imageUrl = 'http://localhost/mini-mart-project/Mini-mart-back-end/uploads/' . $filename;
        echo json_encode(["message" => "Upload ជោគជ័យ", "image" => $imageUrl, "filename" => $filename]);
    } else {
        echo json_encode(["error" => "មិនអាចរក្សាទុករូបភាពបានទេ"]);
    }
} else {
    echo json_encode(["error" => "មិនមានរូបភាពដែលបានផ្ញើមកទេ"]);
}
