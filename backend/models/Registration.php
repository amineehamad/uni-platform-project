<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/Event.php';

class Registration {

    private PDO $db;
    private Event $eventModel;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->eventModel = new Event();
    }

    public function exists(int $userId, int $eventId): bool {
        $stmt = $this->db->prepare(
            'SELECT 1 FROM event_registrations WHERE user_id = :user_id AND event_id = :event_id LIMIT 1'
        );
        $stmt->execute([':user_id' => $userId, ':event_id' => $eventId]);
        return (bool)$stmt->fetchColumn();
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
        return array_map([$this->eventModel, 'decode'], $rows);
    }

    public function register(int $userId, int $eventId): bool {
        if ($this->exists($userId, $eventId)) {
            return false;
        }

        $event = $this->eventModel->getById($eventId);
        if (!$event || $event['seats_remaining'] <= 0) {
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

    public function cancel(int $userId, int $eventId): bool {
        if (!$this->exists($userId, $eventId)) {
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
}
