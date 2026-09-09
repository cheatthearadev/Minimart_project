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
    $allowedTypes = ['image/jpeg', 'image/png'];
    $maxSize = 2 * 1024 * 1024; // 2MB

    if (!in_array($file['type'], $allowedTypes)) {
        echo json_encode(["error" => "Only JPG and PNG images are allowed"]);
        exit();
    }

    if ($file['size'] > $maxSize) {
        echo json_encode(["error" => "Image size must be less than 2MB"]);
        exit();
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png'])) {
        echo json_encode(["error" => "Only JPG, JPEG, and PNG images are allowed"]);
        exit();
    }

    $filename = 'profile_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
    $filepath = $uploadDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        $imageUrl = 'http://localhost/mini-mart-project/Mini-mart-back-end/uploads/' . $filename;
        echo json_encode(["message" => "Upload successful", "image" => $imageUrl, "filename" => $filename]);
    } else {
        echo json_encode(["error" => "Failed to save image"]);
    }
} else {
    echo json_encode(["error" => "No image provided"]);
}
