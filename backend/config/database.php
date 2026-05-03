<?php

class Database {
    private static $instance = null;
    private $pdo;

    private string $host     = 'localhost';
    private string $dbname   = 'event_management';
    private string $username = 'root';
    private string $password = '';
    private string $charset  = 'utf8mb4';

    private function __construct() {

        $dsn = "mysql:host={$this->host};dbname={$this->dbname};charset={$this->charset}";

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $this->pdo = new PDO($dsn, $this->username, $this->password, $options);

        } catch (PDOException $e) {

            http_response_code(500);
            header('Content-Type: application/json');

            echo json_encode([
                'success' => false,
                'message' => 'Database connection failed',
                'error'   => $e->getMessage() // ❗ utile en dev (à enlever en prod)
            ]);

            exit;
        }
    }

    public static function getInstance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection(): PDO {
        return $this->pdo;
    }
}