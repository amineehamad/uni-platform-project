<?php

class Validator {

    private array $errors = [];

    // ── fluent entry point ──────────────────────────────────────────────────
    public function validate(array $data, array $rules): self {
        $this->errors = [];

        foreach ($rules as $field => $fieldRules) {
            $value = $data[$field] ?? null;

            foreach ($fieldRules as $rule => $param) {
                // Support both indexed ('required') and keyed ('min' => 3) rules
                if (is_int($rule)) {
                    $rule  = $param;
                    $param = null;
                }
                $this->applyRule($field, $value, $rule, $param);
            }
        }

        return $this;
    }

    // ── rule engine ─────────────────────────────────────────────────────────
    private function applyRule(string $field, mixed $value, string $rule, mixed $param): void {
        switch ($rule) {
            case 'required':
                if ($value === null || $value === '') {
                    $this->errors[$field][] = "{$field} is required.";
                }
                break;

            case 'string':
                if ($value !== null && !is_string($value)) {
                    $this->errors[$field][] = "{$field} must be a string.";
                }
                break;

            case 'min':
                if ($value !== null && strlen((string)$value) < (int)$param) {
                    $this->errors[$field][] = "{$field} must be at least {$param} characters.";
                }
                break;

            case 'max':
                if ($value !== null && strlen((string)$value) > (int)$param) {
                    $this->errors[$field][] = "{$field} must not exceed {$param} characters.";
                }
                break;

            case 'email':
                if ($value !== null && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->errors[$field][] = "{$field} must be a valid email address.";
                }
                break;

            case 'university_email':
                // Reject common free email providers; adjust list as needed
                $freeProviders = ['gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com','live.com'];
                if ($value !== null) {
                    $domain = strtolower(substr(strrchr($value, '@'), 1));
                    if (in_array($domain, $freeProviders, true)) {
                        $this->errors[$field][] = "{$field} must be a university (.edu or institutional) email address.";
                    }
                }
                break;

            case 'date':
                if ($value !== null) {
                    $d = DateTime::createFromFormat('Y-m-d', $value);
                    if (!$d || $d->format('Y-m-d') !== $value) {
                        $this->errors[$field][] = "{$field} must be a valid date (YYYY-MM-DD).";
                    }
                }
                break;

            case 'min_age':
                if ($value !== null) {
                    $birthDate = DateTime::createFromFormat('Y-m-d', $value);
                    if ($birthDate) {
                        $age = (int)(new DateTime())->diff($birthDate)->y;
                        if ($age < (int)$param) {
                            $this->errors[$field][] = "You must be at least {$param} years old to register.";
                        }
                    }
                }
                break;

            case 'in':
                if ($value !== null && !in_array($value, (array)$param, true)) {
                    $allowed = implode(', ', (array)$param);
                    $this->errors[$field][] = "{$field} must be one of: {$allowed}.";
                }
                break;

            case 'confirmed':
                // Expects a companion field named {field}_confirmation in the parent data
                // Handled externally (see AuthController) for simplicity
                break;
        }
    }

    // ── result helpers ───────────────────────────────────────────────────────
    public function passes(): bool {
        return empty($this->errors);
    }

    public function fails(): bool {
        return !$this->passes();
    }

    public function errors(): array {
        return $this->errors;
    }

    public function firstError(): string {
        foreach ($this->errors as $messages) {
            return $messages[0] ?? '';
        }
        return '';
    }
}
