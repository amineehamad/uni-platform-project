# Event Management — Backend API

## Stack
- **PHP 8.1+** (no framework, no Composer required)
- **MySQL 8+**
- **Apache** with `mod_rewrite`

---

## Folder Structure

```
event-management-backend/
├── config/
│   ├── database.php        ← PDO singleton connection
│   └── schema.sql          ← Run this once to create the DB
├── controllers/
│   └── AuthController.php  ← register / login / me
├── middleware/
│   └── AuthMiddleware.php  ← JWT guard for protected routes
├── models/
│   └── User.php            ← DB queries for users table
├── routes/
│   └── api.php             ← URL → controller dispatcher
├── utils/
│   ├── JWT.php             ← HS256 JWT (generate / verify)
│   ├── Response.php        ← JSON response helper
│   └── Validator.php       ← Validation engine
├── .htaccess               ← Apache URL rewrite
└── index.php               ← Entry point + CORS
```

---

## Setup

1. **Create the database**
   ```sql
   mysql -u root -p < config/schema.sql
   ```

2. **Edit credentials** in `config/database.php`

3. **Change the JWT secret** in `utils/JWT.php`
   ```php
   private static string $secret = 'YOUR_STRONG_SECRET_KEY_HERE';
   ```

4. **Point Apache** document root to this folder (or place it under `htdocs/`)

---

## API Endpoints

### POST `/api/auth/register`
Create a new account.

**Request body (JSON)**
```json
{
  "first_name": "Amine",
  "last_name": "hamed",
  "email": "amine.hamed@insat.ucar.tn",
  "birthday": "2005-12-16",
  "academic_year": "p2",
  "password": "SecurePass123",
  "password_confirmation": "SecurePass123"
}
```

**Validation rules**
| Field | Rules |
|---|---|
| first_name | Required, 2–50 chars |
| last_name | Required, 2–50 chars |
| email | Required, valid email, university domain only (no gmail/yahoo/etc.) |
| birthday | Required, YYYY-MM-DD, user must be ≥ 18 years old |
| academic_year | Required, one of: L1, L2, L3, M1, M2, PhD, Other |
| password | Required, 8–128 chars |
| password_confirmation | Must match password |

**Success (201)**
```json
{
  "success": true,
  "message": "Account created successfully.",
  "token": "<JWT>",
  "user": { "id": 1, "first_name": "Amine", ... }
}
```

---

### POST `/api/auth/login`
Sign in with email + password.

**Request body (JSON)**
```json
{
  "email": "amine.trabelsi@enit.utm.tn",
  "password": "SecurePass123"
}
```

**Success (200)**
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "<JWT>",
  "user": { ... }
}
```

---

### GET `/api/auth/me`  *(protected)*
Get the authenticated user's profile.

**Header:** `Authorization: Bearer <JWT>`

---

## Error Responses

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "birthday": ["You must be at least 18 years old to register."],
    "email": ["email must be a university (.edu or institutional) email address."]
  }
}
```

| HTTP Code | Meaning |
|---|---|
| 400 | Bad request / invalid JSON |
| 401 | Unauthorized |
| 409 | Email already exists |
| 422 | Validation error |
| 500 | Server error |
