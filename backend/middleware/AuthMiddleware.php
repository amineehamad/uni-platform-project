<?php

require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../utils/Response.php';

class AuthMiddleware {


    public static function handle(): array {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        if (!str_starts_with($header, 'Bearer ')) {
            Response::error('Unauthorized. No token provided.', 401);
        }

        $token   = substr($header, 7);
        $payload = JWT::verify($token);

        if (!$payload) {
            Response::error('Unauthorized. Token is invalid or expired.', 401);
        }

        return $payload;
    }
}
