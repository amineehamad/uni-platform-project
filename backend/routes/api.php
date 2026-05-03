<?php

require_once __DIR__ . '/../controllers/AuthController.php';

/**
 * Simple URL router.
 * Parses METHOD + PATH and dispatches to the correct controller action.
 */
function router(): void {
    $method = $_SERVER['REQUEST_METHOD'];
    $uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

    $path = str_replace('/web/backend','', $uri);

    $auth = new AuthController();

    // ── Auth routes (public) ───────────────────────────────────────────────
    if ($method === 'POST' && $path === '/auth/register') {
        $auth->register();
        return;
    }

    if ($method === 'POST' && $path === '/auth/login') {
        $auth->login();
        return;
    }

    // ── Auth routes (protected) ────────────────────────────────────────────
    if ($method === 'GET' && $path === '/auth/me') {
        $auth->me();
        return;
    }

    // ── 404 fallback ───────────────────────────────────────────────────────
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => "Route [{$method}] {$path} not found."]);
}
