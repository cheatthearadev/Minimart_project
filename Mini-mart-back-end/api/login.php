<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../controllers/Authcontroller.php';

$controller = new AuthController();
$data = json_decode(file_get_contents("php://input"));
$controller->authenticate($data);
