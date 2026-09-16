<?php
include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/helpers.php';
include_once __DIR__ . '/../config/dotenv.php';

$data = json_decode(file_get_contents("php://input"));
if (!$data || empty($data->message)) apiError("Message is required");

$botToken = getenv('TELEGRAM_BOT_TOKEN') ?: '';
$chatId = getenv('TELEGRAM_OWNER_CHAT_ID') ?: '';

if (empty($botToken) || empty($chatId)) apiError("Telegram bot not configured");

$apiUrl = "https://api.telegram.org/bot{$botToken}/sendMessage";
$payload = json_encode(["chat_id" => $chatId, "text" => $data->message]);

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
    apiSuccess(["message" => "Receipt sent to Telegram"]);
} else {
    $resp = json_decode($response, true);
    apiError($resp['description'] ?? 'Failed to send', 500);
}
