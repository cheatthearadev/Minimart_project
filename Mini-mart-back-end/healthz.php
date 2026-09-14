<?php

$host = getenv('MYSQL_ADDON_HOST');
$port = getenv('MYSQL_ADDON_PORT');
$db   = getenv('MYSQL_ADDON_DB');
$user = getenv('MYSQL_ADDON_USER');
$pass = getenv('MYSQL_ADDON_PASSWORD');

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
