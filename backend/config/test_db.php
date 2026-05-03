<?php
require_once __DIR__ . '/database.php';

$db = Database::getInstance()->getConnection();

echo "DB CONNECTED SUCCESS";