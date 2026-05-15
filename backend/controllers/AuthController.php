<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class AuthController {

    private User $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    public function register(): void {
        $body = $this->getJsonBody();

        $validator = new Validator();
        $validator->validate($body, [
            'first_name' => ['required', 'string', 'min' => 2, 'max' => 50],
            'last_name'  => ['required', 'string', 'min' => 2, 'max' => 50],
            'email'      => ['required', 'email', 'university_email'],

            'birthdate'  => ['required', 'date', 'min_age' => 18],

            'academic_year' => [
                'required',
                'in' => [
                    '1st Year',
                    '2nd Year',
                    '3rd Year',
                    '4th Year',
                    '5th Year'
                ]
            ],

            'password' => ['required', 'min' => 8, 'max' => 128],

            'password_confirmation' => ['required', 'same:password']
        ]);

        if (($body['password'] ?? '') !== ($body['password_confirmation'] ?? '')) {
            $validator->validate(['password_confirmation' => ''], [
                // Force an error by re-running with mismatched data trick
            ]);
            // Direct error injection
            Response::error('Passwords do not match.', 422, ['errors' => ['password_confirmation' => ['Passwords do not match.']]]);
        }

        if ($validator->fails()) {
            Response::error('Validation failed.', 422, ['errors' => $validator->errors()]);
        }

        // ── 2. Check email uniqueness ─────────────────────────────────────────
        if ($this->userModel->emailExists($body['email'])) {
            Response::error('An account with this email already exists.', 409);
        }

        // ── 3. Create user ────────────────────────────────────────────────────
        try {
            $userId = $this->userModel->create($body);
        } catch (PDOException $e) {
            Response::error('Registration failed. Please try again.', 500);
        }

        // ── 4. Issue JWT ──────────────────────────────────────────────────────
        $token = JWT::generate(['sub' => $userId, 'email' => strtolower(trim($body['email']))]);
        $user  = $this->userModel->findById($userId);

        Response::success('Account created successfully.', [
            'token' => $token,
            'user'  => $this->userModel->publicProfile($user),
        ], 201);
    }

    // ── POST /auth/login ──────────────────────────────────────────────────────
    public function login(): void {
        $body = $this->getJsonBody();

        // ── 1. Validate ────────────────────────────────────────────────────────
        $validator = new Validator();
        $validator->validate($body, [
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        if ($validator->fails()) {
            Response::error('Validation failed.', 422, ['errors' => $validator->errors()]);
        }

        // ── 2. Find user ───────────────────────────────────────────────────────
        $user = $this->userModel->findByEmail($body['email']);

        if (!$user) {
            Response::error('Invalid email or password.', 401);
        }

        // ── 3. Verify password ─────────────────────────────────────────────────
        if (!$this->userModel->verifyPassword($body['password'], $user['password_hash'])) {
            Response::error('Invalid email or password.', 401);
        }

        // ── 4. Issue JWT ───────────────────────────────────────────────────────
        $token = JWT::generate(['sub' => $user['id'], 'email' => $user['email']]);

        Response::success('Login successful.', [
            'token' => $token,
            'user'  => $this->userModel->publicProfile($user),
        ]);
    }

    // ── GET /auth/me  (protected) ─────────────────────────────────────────────
    public function me(): void {
        $payload = $this->requireAuth();
        $user    = $this->userModel->findById($payload['sub']);

        if (!$user) {
            Response::error('User not found.', 404);
        }

        Response::success('Authenticated user.', ['user' => $this->userModel->publicProfile($user)]);
    }

    public function logout(): void {
        $this->requireAuth();
        Response::success('Logged out successfully.');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private function getJsonBody(): array {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            Response::error('Invalid JSON body.', 400);
        }
        return $data;
    }

    private function requireAuth(): array {
        return AuthMiddleware::handle();
    }
}
