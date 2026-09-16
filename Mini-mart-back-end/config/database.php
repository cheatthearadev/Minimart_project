<?php
include_once __DIR__ . '/dotenv.php';

$host = getenv('DB_HOST') ?: getenv('MYSQL_ADDON_HOST') ?: 'localhost';
$port = getenv('DB_PORT') ?: getenv('MYSQL_ADDON_PORT') ?: '3306';
$db = getenv('DB_NAME') ?: getenv('MYSQL_ADDON_DB') ?: 'minimart_db';
$username = getenv('DB_USER') ?: getenv('MYSQL_ADDON_USER') ?: 'root';
$password = getenv('DB_PASSWORD') ?: getenv('MYSQL_ADDON_PASSWORD') ?: '';

try {
    $conn = new PDO(
        "mysql:host=$host;port=$port;dbname=$db;charset=utf8",
        $username,
        $password,
        [
            PDO::ATTR_PERSISTENT => true,
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ]
    );

} catch (PDOException $exception) {
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        "error" => "Database connection failed: " . $exception->getMessage()
    ]);
    exit();
}

class Database {
    public function getConnection() {
        global $conn;
        return $conn;
    }
}
