<?php

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowed = false;

// Main production domain
if ($origin === 'https://minimart-project-seven.vercel.app') {
    $allowed = true;
}

// Vercel preview/deployment domains
if (preg_match(
    '/^https:\/\/minimart-project-[a-z0-9]+-cheatthearadevs-projects\.vercel\.app$/',
    $origin
)) {
    $allowed = true;
}

if ($allowed) {
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
