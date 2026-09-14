<?php

class JWT {
    private static $secret = 'minimart_jwt_secret_key_2026';
    private static $algo = 'HS256';

    public static function encode($payload) {
        $header = self::base64UrlEncode(json_encode([
            'typ' => 'JWT',
            'alg' => self::$algo
        ]));

        $payload['iat'] = time();
        $payload['exp'] = time() + (8 * 60 * 60);
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));

        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payloadEncoded", self::$secret, true)
        );

        return "$header.$payloadEncoded.$signature";
    }

    public static function decode($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        [$header, $payload, $signature] = $parts;

        $expectedSig = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", self::$secret, true)
        );

        if (!hash_equals($expectedSig, $signature)) return null;

        $payloadData = json_decode(self::base64UrlDecode($payload), true);
        if (!$payloadData) return null;

        if (isset($payloadData['exp']) && $payloadData['exp'] < time()) return null;

        return $payloadData;
    }

    public static function getUserIdFromRequest() {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) return null;

        $payload = self::decode($matches[1]);
        if (!$payload || !isset($payload['user_id'])) return null;

        return $payload['user_id'];
    }

    public static function requireAuth() {
        $userId = self::getUserIdFromRequest();
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'Authentication required']);
            exit();
        }
        return $userId;
    }

    public static function requireAdmin() {
        $userId = self::requireAuth();
        global $conn;
        $stmt = $conn->prepare("SELECT role FROM user WHERE id = :id LIMIT 1");
        $stmt->bindParam(":id", $userId);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || $user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Admin access required']);
            exit();
        }
        return $userId;
    }

    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
