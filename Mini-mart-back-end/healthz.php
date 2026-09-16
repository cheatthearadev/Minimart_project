<?php

$host = getenv('DB_HOST') ?: getenv('MYSQL_ADDON_HOST') ?: 'localhost';
$port = getenv('DB_PORT') ?: getenv('MYSQL_ADDON_PORT') ?: '3306';
$db   = getenv('DB_NAME') ?: getenv('MYSQL_ADDON_DB') ?: 'minimart_db';
$user = getenv('DB_USER') ?: getenv('MYSQL_ADDON_USER') ?: 'root';
$pass = getenv('DB_PASSWORD') ?: getenv('MYSQL_ADDON_PASSWORD') ?: '';

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]
    );

    echo "OK - MySQL connected";
} catch (PDOException $e) {
    http_response_code(500);
    echo "MySQL connection failed";
}
