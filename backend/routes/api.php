<?php

require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/EventController.php';
require_once __DIR__ . '/../controllers/RegistrationController.php';

function router(): void {
    $method = $_SERVER['REQUEST_METHOD'];
    $uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

    $path = str_replace('/web/backend', '', $uri);

    $auth         = new AuthController();
    $event        = new EventController();
    $registration = new RegistrationController();

    // ── Auth routes (public) ───────────────────────────────────────────────
    if ($method === 'POST' && $path === '/auth/register') {
        $auth->register();
        return;
    }

    if ($method === 'POST' && $path === '/auth/login') {
        $auth->login();
        return;
    }
    if ($method === 'POST' && $path === '/auth/logout') {
        $auth->logout();
        return;
    }
    // ── Auth routes (protected) ────────────────────────────────────────────
    if ($method === 'GET' && $path === '/auth/me') {
        $auth->me();
        return;
    }

    // ── Event routes (public) ──────────────────────────────────────────────
    if ($method === 'GET' && $path === '/events') {
        $event->index();
        return;
    }

    if ($method === 'GET' && preg_match('#^/events/(\d+)$#', $path, $m)) {
        $event->show((int)$m[1]);
        return;
    }

    // ── Registration routes (protected) ───────────────────────────────────
    if ($method === 'POST' && preg_match('#^/events/(\d+)/register$#', $path, $m)) {
        $registration->register((int)$m[1]);
        return;
    }

    if ($method === 'DELETE' && preg_match('#^/events/(\d+)/(?:register|cancel)$#', $path, $m)) {
        $registration->cancel((int)$m[1]);
        return;
    }

    if ($method === 'GET' && $path === '/users/me/events') {
        $registration->myEvents();
        return;
    }

    // ── 404 fallback ───────────────────────────────────────────────────────
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => "Route [{$method}] {$path} not found."]);
}