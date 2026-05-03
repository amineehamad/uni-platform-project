<?php

/**
 * Minimal JWT helper (HS256) — no external dependency required.
 * For production consider firebase/php-jwt via Composer.
 */
class JWT {

    private static string $secret = 'amine';
    private static int    $ttl    = 3600 * 24; // 24 hours

    public static function generate(array $payload): string {
        $header  = self::base64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload['iat'] = time();
        $payload['exp'] = time() + self::$ttl;
        $body    = self::base64url(json_encode($payload));
        $sig     = self::base64url(hash_hmac('sha256', "{$header}.{$body}", self::$secret, true));
        return "{$header}.{$body}.{$sig}";
    }

    public static function verify(string $token): array|false {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return false;

        [$header, $body, $sig] = $parts;
        $expected = self::base64url(hash_hmac('sha256', "{$header}.{$body}", self::$secret, true));

        if (!hash_equals($expected, $sig)) return false;

        $payload = json_decode(self::base64urlDecode($body), true);
        if (!$payload || $payload['exp'] < time()) return false;

        return $payload;
    }

    private static function base64url(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64urlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
