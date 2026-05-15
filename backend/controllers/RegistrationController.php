<?php

require_once __DIR__ . '/../models/Registration.php';
require_once __DIR__ . '/../models/Event.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class RegistrationController {

    private Registration $registrationModel;
    private Event $eventModel;

    public function __construct() {
        $this->registrationModel = new Registration();
        $this->eventModel = new Event();
    }

    public function register(int $eventId): void {
        $payload = AuthMiddleware::handle();
        $userId  = $payload['sub'];
        $event   = $this->eventModel->getById($eventId);

        if (!$event) {
            Response::error('Event not found.', 404);
        }

        if ($event['seats_remaining'] <= 0) {
            Response::error('Event is full.', 409);
        }

        if ($this->registrationModel->exists($userId, $eventId)) {
            Response::error('You are already registered for this event.', 409);
        }

        try {
            $ok = $this->registrationModel->register($userId, $eventId);
        } catch (PDOException $e) {
            Response::error('Could not complete registration. Please try again.', 500);
        }

        if (!$ok) {
            Response::error('Could not reserve seat. Try again.', 500);
        }

        $ticketId = 'TKT-' . strtoupper(bin2hex(random_bytes(4)));

        Response::success('Registration successful!', [
            'ticket_id'      => $ticketId,
            'seats_remaining'=> $event['seats_remaining'] - 1,
        ], 201);
    }

    public function cancel(int $eventId): void {
        $payload = AuthMiddleware::handle();
        $userId  = $payload['sub'];
        $event   = $this->eventModel->getById($eventId);

        if (!$event) {
            Response::error('Event not found.', 404);
        }

        try {
            $ok = $this->registrationModel->cancel($userId, $eventId);
        } catch (PDOException $e) {
            Response::error('Could not cancel registration. Please try again.', 500);
        }

        if (!$ok) {
            Response::error('Could not cancel registration.', 500);
        }

        Response::success('Registration cancelled.', [
            'seats_remaining' => $event['seats_remaining'] + 1,
        ]);
    }

    public function myEvents(): void {
        $payload = AuthMiddleware::handle();
        $events  = $this->registrationModel->getUserEvents($payload['sub']);
        Response::success('User events fetched.', ['events' => $events]);
    }
}
