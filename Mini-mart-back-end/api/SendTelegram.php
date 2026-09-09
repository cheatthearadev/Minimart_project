<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || empty($data->message)) {
    echo json_encode(["error" => "Message is required"]);
    exit();
}

$envFile = file_get_contents(__DIR__ . '/../../mini-mart-bot/.env');
$botToken = '';
$chatId = '';

if ($envFile) {
    if (preg_match('/BOT_TOKEN=(.+)/', $envFile, $m)) $botToken = trim($m[1]);
    if (preg_match('/OWNER_CHAT_ID=(.+)/', $envFile, $m)) $chatId = trim($m[1]);
}

if (empty($botToken) || empty($chatId)) {
    echo json_encode(["error" => "Telegram bot not configured"]);
    exit();
}

$message = $data->message;

$apiUrl = "https://api.telegram.org/bot{$botToken}/sendMessage";
$payload = json_encode([
    "chat_id" => $chatId,
    "text" => $message
]);

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo json_encode(["success" => true, "message" => "Receipt sent to Telegram"]);
} else {
    $resp = json_decode($response, true);
    $errorMsg = $resp['description'] ?? 'Failed to send';
    echo json_encode(["error" => $errorMsg]);
}
