<?php

$host = getenv('DB_HOST') ?: 'localhost';
$port = getenv('DB_PORT') ?: '3306';
$db = getenv('DB_NAME') ?: 'minimart_db';
$username = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASSWORD') ?: '';

try {
    $conn = new PDO(
        "mysql:host=$host;port=$port;dbname=$db;charset=utf8",
        $username,
        $password
    );

    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch (PDOException $exception) {
    echo json_encode([
        "error" => "Database connection failed"
    ]);
    exit();
}

class Database {
    public function getConnection() {
        global $conn;
        return $conn;
    }
}
