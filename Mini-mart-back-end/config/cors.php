<?php

ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

$allowedOrigins = [
    'http://localhost:8000',
    'http://localhost:3000',
    'http://localhost',
    'http://localhost:5173',
    'https://minimart-project-2.onrender.com',
    'https://minimart-project-seven.vercel.app',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowed = false;
if (in_array($origin, $allowedOrigins)) {
    $allowed = true;
} elseif (preg_match('/^https:\/\/minimart-project-[a-z0-9-]+\.vercel\.app$/i', $origin)) {
    $allowed = true;
}

if ($allowed && $origin) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        if (php_sapi_name() !== 'cli') {
            header_remove('Content-Type');
            header('Content-Type: application/json; charset=UTF-8');
            http_response_code(500);
        }
        error_log("Fatal error: {$error['message']} in {$error['file']}:{$error['line']}");
        echo json_encode(['error' => 'Internal server error', 'detail' => $error['message']]);
        exit;
    }
});

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}
