<?php

require_once __DIR__ . '/../config/database.php';

class Event {

    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    // ── GET /events ────────────────────────────────────────────────────────
    public function getAll(array $filters = []): array {
        $where  = [];
        $params = [];

        if (!empty($filters['category'])) {
            $where[]              = 'category = :category';
            $params[':category']  = $filters['category'];
        }

        if (!empty($filters['search'])) {
            $where[]            = '(title LIKE :search OR club LIKE :search OR description LIKE :search)';
            $params[':search']  = '%' . $filters['search'] . '%';
        }

        if (isset($filters['free']) && $filters['free'] === '1') {
            $where[] = 'price = 0';
        }

        $sql = 'SELECT * FROM events';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY date ASC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        // Decode JSON columns
        return array_map([$this, 'decode'], $rows);
    }

    // ── GET /events/{id} ───────────────────────────────────────────────────
    public function getById(int $id): array|false {
        $stmt = $this->db->prepare('SELECT * FROM events WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return $row ? $this->decode($row) : false;
    }

    // ── Decrement seats_remaining (called on registration) ─────────────────
    public function decrementSeat(int $id): bool {
        $stmt = $this->db->prepare(
            'UPDATE events
             SET seats_remaining = seats_remaining - 1
             WHERE id = :id AND seats_remaining > 0'
        );
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() > 0;   // false if already full
    }

    // ── Increment seats_remaining (called on cancellation) ─────────────────
    public function incrementSeat(int $id): bool {
        $stmt = $this->db->prepare(
            'UPDATE events
             SET seats_remaining = LEAST(seats_remaining + 1, seats_total)
             WHERE id = :id'
        );
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() > 0;
    }

    public function findRegistration(int $userId, int $eventId): array|false {
        $stmt = $this->db->prepare(
            'SELECT * FROM event_registrations WHERE user_id = :user_id AND event_id = :event_id LIMIT 1'
        );
        $stmt->execute([':user_id' => $userId, ':event_id' => $eventId]);
        return $stmt->fetch();
    }

    public function getUserEvents(int $userId): array {
        $stmt = $this->db->prepare(
            'SELECT e.*
             FROM events e
             INNER JOIN event_registrations r ON r.event_id = e.id
             WHERE r.user_id = :user_id
             ORDER BY e.date ASC'
        );
        $stmt->execute([':user_id' => $userId]);
        $rows = $stmt->fetchAll();
        return array_map([$this, 'decode'], $rows);
    }

    public function registerUser(int $userId, int $eventId): bool {
        if ($this->findRegistration($userId, $eventId)) {
            return false;
        }

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare(
                'UPDATE events
                 SET seats_remaining = seats_remaining - 1
                 WHERE id = :id AND seats_remaining > 0'
            );
            $stmt->execute([':id' => $eventId]);

            if ($stmt->rowCount() === 0) {
                $this->db->rollBack();
                return false;
            }

            $stmt = $this->db->prepare(
                'INSERT INTO event_registrations (user_id, event_id) VALUES (:user_id, :event_id)'
            );
            $stmt->execute([':user_id' => $userId, ':event_id' => $eventId]);

            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    public function cancelRegistration(int $userId, int $eventId): bool {
        if (!$this->findRegistration($userId, $eventId)) {
            return false;
        }

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare(
                'DELETE FROM event_registrations WHERE user_id = :user_id AND event_id = :event_id'
            );
            $stmt->execute([':user_id' => $userId, ':event_id' => $eventId]);

            if ($stmt->rowCount() === 0) {
                $this->db->rollBack();
                return false;
            }

            $stmt = $this->db->prepare(
                'UPDATE events
                 SET seats_remaining = LEAST(seats_remaining + 1, seats_total)
                 WHERE id = :id'
            );
            $stmt->execute([':id' => $eventId]);

            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    // ── Decode JSON columns ─────────────────────────────────────────────────
    public function decode(array $row): array {
        $row['tags']            = json_decode($row['tags'],            true) ?? [];
        $row['recommended_for'] = json_decode($row['recommended_for'], true) ?? [];
        $row['price']           = (float)$row['price'];
        $row['seats_total']     = (int)$row['seats_total'];
        $row['seats_remaining'] = (int)$row['seats_remaining'];
        return $row;
    }
}