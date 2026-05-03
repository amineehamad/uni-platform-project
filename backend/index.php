<?php

declare(strict_types=1);

// ── CORS Headers ────────────────────────────────────────────────────────────
// Replace * with your frontend origin in production, e.g. 'http://localhost:5173'
header('Access-Control-Allow-Origin: http://127.0.0.1:5500');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Handle pre-flight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Autoload ─────────────────────────────────────────────────────────────────
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/routes/api.php';

// ── Dispatch ─────────────────────────────────────────────────────────────────
router();
