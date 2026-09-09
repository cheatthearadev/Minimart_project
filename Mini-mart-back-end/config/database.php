<?php

$host = "localhost";
$db = "minimart_db";
$username = "root";
$password = "";

try {
    $conn = new PDO(
        "mysql:host=$host;dbname=$db;charset=utf8",
        $username,
        $password
    );
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch (PDOException $exception) {
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