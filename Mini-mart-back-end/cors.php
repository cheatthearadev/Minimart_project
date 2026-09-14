<?php

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowedOrigins = [
    'https://minimart-project-seven.vercel.app',
];

$isAllowed = in_array($origin, $allowedOrigins, true)
    || preg_match(
        '/^https:\/\/minimart-project-[a-z0-9]+-cheatthearadevs-projects\.vercel\.app$/i',
        $origin
    );

if ($isAllowed) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
