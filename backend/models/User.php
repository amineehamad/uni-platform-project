<?php

require_once __DIR__ . '/../config/database.php';

class User {

    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    // ── CREATE USER ────────────────────────────────────────────────
    public function create(array $data): int|false {

        $sql = "INSERT INTO users 
                (first_name, last_name, email, password_hash, birthdate, academic_year)
                VALUES 
                (:first_name, :last_name, :email, :password_hash, :birthdate, :academic_year)";

        $stmt = $this->db->prepare($sql);

        $password_hash = password_hash(
            $data['password'],
            PASSWORD_BCRYPT,
            ['cost' => 12]
        );

        $stmt->execute([
            ':first_name'    => trim($data['first_name']),
            ':last_name'     => trim($data['last_name']),
            ':email'         => strtolower(trim($data['email'])),
            ':password_hash' => $password_hash,
            ':birthdate'     => $data['birthdate'],
            ':academic_year' => $data['academic_year'],
        ]);

        return (int)$this->db->lastInsertId();
    }

    // ── FIND BY EMAIL ───────────────────────────────────────────────
    public function findByEmail(string $email): array|false {

        $stmt = $this->db->prepare(
            "SELECT * FROM users WHERE email = :email LIMIT 1"
        );

        $stmt->execute([
            ':email' => strtolower(trim($email))
        ]);

        return $stmt->fetch();
    }

    // ── FIND BY ID ─────────────────────────────────────────────────
    public function findById(int $id): array|false {

        $stmt = $this->db->prepare(
            "SELECT id, first_name, last_name, email, birthdate, academic_year, is_verified, created_at 
             FROM users 
             WHERE id = :id 
             LIMIT 1"
        );

        $stmt->execute([':id' => $id]);

        return $stmt->fetch();
    }

    // ── CHECK EMAIL EXISTS ──────────────────────────────────────────
    public function emailExists(string $email): bool {

        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM users WHERE email = :email"
        );

        $stmt->execute([
            ':email' => strtolower(trim($email))
        ]);

        return (bool)$stmt->fetchColumn();
    }

    // ── VERIFY PASSWORD ─────────────────────────────────────────────
    public function verifyPassword(string $plain, string $hash): bool {
        return password_verify($plain, $hash);
    }

    // ── SAFE USER OUTPUT ───────────────────────────────────────────
    public function publicProfile(array $user): array {
        unset($user['password_hash']);
        return $user;
    }
}