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
$allowedTypes = ['image/jpeg', 'image/png'];
$maxSize = 2 * 1024 * 1024;

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!in_array($mimeType, $allowedTypes)) {
    apiError("Only JPG and PNG images are allowed");
}

if ($file['size'] > $maxSize) {
    apiError("Image size must be less than 2MB");
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($ext, ['jpg', 'jpeg', 'png'])) {
    apiError("Invalid file extension");
}

$filename = 'profile_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
$filepath = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $filepath)) {
    chmod($filepath, 0644);
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $baseUrl = getenv('APP_BASE_URL') ?: "$scheme://$host/mini-mart-project/Mini-mart-back-end";
    $imageUrl = $baseUrl . '/uploads/' . $filename;
    apiSuccess(["message" => "Upload successful", "image" => $imageUrl, "filename" => $filename]);
} else {
    apiError("Failed to save image", 500);
}
