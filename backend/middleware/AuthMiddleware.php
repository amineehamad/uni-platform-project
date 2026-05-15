<?php

require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../utils/Response.php';

class AuthMiddleware {

    private static function getAuthorizationHeader(): string {
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            return trim($_SERVER['HTTP_AUTHORIZATION']);
        }

        if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
        }

        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (!empty($headers['Authorization'])) {
                return trim($headers['Authorization']);
            }
            if (!empty($headers['authorization'])) {
                return trim($headers['authorization']);
            }
        }

        return '';
    }

    public static function handle(): array {
        $header = self::getAuthorizationHeader();

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
