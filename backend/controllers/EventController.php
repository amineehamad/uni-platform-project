<?php

require_once __DIR__ . '/../models/Event.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class EventController {

    private Event $model;

    public function __construct() {
        $this->model = new Event();
    }

    // GET /events
    public function index(): void {
        $filters = [
            'category' => $_GET['category'] ?? null,
            'search'   => $_GET['search']   ?? null,
            'free'     => $_GET['free']     ?? null,
        ];
        $events = $this->model->getAll(array_filter($filters));
        Response::success('Events fetched.', ['events' => $events]);
    }

    // GET /events/{id}
    public function show(int $id): void {
        $event = $this->model->getById($id);
        if (!$event) Response::error('Event not found.', 404);
        Response::success('Event fetched.', ['event' => $event]);
    }

    // Registration routes are handled by RegistrationController.
}