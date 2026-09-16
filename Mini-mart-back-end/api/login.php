<?php
include_once __DIR__ . '/../config/cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

include_once __DIR__ . '/../controllers/Authcontroller.php';

$controller = new AuthController();
$data = json_decode(file_get_contents("php://input"));
$controller->authenticate($data);
