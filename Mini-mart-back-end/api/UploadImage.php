<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../config/helpers.php';

JWT::requireAuth();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

$uploadDir = __DIR__ . '/../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if (empty($_FILES['image'])) apiError("No image provided");

$file = $_FILES['image'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
$maxSize = 5 * 1024 * 1024;

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!in_array($mimeType, $allowedTypes)) {
    apiError("Only JPG, PNG, GIF, WebP images are allowed");
}

if ($file['size'] > $maxSize) {
    apiError("Image size must be less than 5MB");
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($ext, $allowedExts)) {
    apiError("Invalid file extension");
}

$filename = 'product_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
$filepath = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $filepath)) {
    chmod($filepath, 0644);
    $imageUrl = 'http://localhost/mini-mart-project/Mini-mart-back-end/uploads/' . $filename;
    apiSuccess(["message" => "Upload successful", "image" => $imageUrl, "filename" => $filename]);
} else {
    apiError("Failed to save image", 500);
}
