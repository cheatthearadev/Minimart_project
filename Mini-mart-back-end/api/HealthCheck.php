<?php
include_once __DIR__ . '/../config/cors.php';
header("Content-Type: application/json; charset=UTF-8");
echo json_encode(["status" => "ok", "timestamp" => time()]);
