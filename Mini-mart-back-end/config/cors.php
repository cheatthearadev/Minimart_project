<?php

$allowedOrigins = [
    'http://localhost:8000',
    'http://localhost:3000',
    'http://localhost',
    'http://localhost:5173',
    'https://minimart-project-2.onrender.com',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowed = false;
if (in_array($origin, $allowedOrigins)) {
    $allowed = true;
} elseif (preg_match('/^https:\/\/minimart-project-[a-z0-9-]+\.vercel\.app$/i', $origin)) {
    $allowed = true;
}

if ($allowed) {
    header("Access-Control-Allow-Origin: $origin");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
