<?php

class Response {
    public static function json(int $statusCode, bool $success, string $message, array $data = []): void {
        http_response_code($statusCode);
        $payload = ['success' => $success, 'message' => $message];
        if (!empty($data)) {
            $payload = array_merge($payload, $data);
        }
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function success(string $message, array $data = [], int $code = 200): void {
        self::json($code, true, $message, $data);
    }

    public static function error(string $message, int $code = 400, array $data = []): void {
        self::json($code, false, $message, $data);
    }
}
