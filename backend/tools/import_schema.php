<?php
require_once __DIR__ . '/../config/database.php';

header('Content-Type: text/plain');

$path = __DIR__ . '/../config/schema.sql';
if (!file_exists($path)) {
    echo "schema.sql not found at: $path\n";
    exit(1);
}

$sql = file_get_contents($path);
if ($sql === false) {
    echo "Could not read schema file\n";
    exit(1);
}

$db = Database::getInstance()->getConnection();

try {
    // split statements by semicolon (naive but OK for this schema)
    $stmts = array_filter(array_map('trim', explode(';', $sql)));
    foreach ($stmts as $stmt) {
        if ($stmt === '') continue;
        $db->exec($stmt);
    }
    echo "Schema imported successfully.\n";
} catch (Exception $e) {
    echo "Error importing schema: " . $e->getMessage() . "\n";
    exit(1);
}

echo "Done.\n";
