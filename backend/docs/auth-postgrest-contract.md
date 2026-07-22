# Authentication PostgREST Contract

This document describes the local-development username/password authentication bridge for
Daqiq ERP. PostgreSQL owns password verification and JWT signing; PostgREST verifies the JWT
and switches into the database role from the token `role` claim.

## Endpoints

### Login

```http
POST /rpc/login
Content-Type: application/json
```

Request:

```json
{
  "email": "admin@erp.com",
  "password": "admin"
}
```

Successful response:

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresAt": "2026-07-22T12:00:00Z",
  "user": {
    "id": "00000000-0000-4000-8000-000000000001",
    "email": "admin@erp.com",
    "displayName": "مدیر سیستم",
    "roles": ["admin"]
  }
}
```

Invalid email, invalid password, inactive user, and users without valid roles return a generic
authentication error. The response must not reveal whether the email exists.

### Current Session

```http
POST /rpc/me
Authorization: Bearer <accessToken>
```

Response:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "email": "admin@erp.com",
  "displayName": "مدیر سیستم",
  "roles": ["admin"]
}
```

This endpoint reads JWT claims supplied by PostgREST. It never returns password hashes.

## JWT Claims

The JWT is signed with HS256 and contains a PostgREST database role claim:

```json
{
  "role": "erp_admin",
  "user_id": "00000000-0000-4000-8000-000000000001",
  "email": "admin@erp.com",
  "display_name": "مدیر سیستم",
  "app_roles": ["admin"],
  "exp": 1784721600
}
```

The `role` claim is the PostgreSQL role used by PostgREST. The `app_roles` claim is the
Angular-facing role list.

## Role Mapping

Application roles map to database roles:

| App role | Database role |
| --- | --- |
| `admin` | `erp_admin` |
| `manager` | `erp_manager` |
| `sales` | `erp_sales` |
| `accountant` | `erp_accountant` |
| `warehouse` | `erp_warehouse` |
| `viewer` | `erp_viewer` |

If a user has multiple app roles, the JWT uses one database role. The current strongest-role
order is `admin`, `manager`, `sales`, `accountant`, `warehouse`, `viewer`.

## Local Development Users

The development seed may create these local-only accounts:

| Email | Password | Role |
| --- | --- | --- |
| `admin@erp.com` | `admin` | `admin` |
| `manager@erp.com` | `manager` | `manager` |
| `sales@erp.com` | `sales` | `sales` |
| `accountant@erp.com` | `accountant` | `accountant` |
| `warehouse@erp.com` | `warehouse` | `warehouse` |
| `viewer@erp.com` | `viewer` | `viewer` |

These credentials are for local development only. Passwords are stored as pgcrypto hashes.

## Secret Configuration

PostgreSQL signing and PostgREST verification must use the same secret:

```text
PGRST_JWT_SECRET=<secret from local env or secret manager>
app.jwt_secret=<same secret set inside PostgreSQL>
```

The committed files contain placeholders only. Do not commit real secrets or JWTs.

## Angular Usage

Angular calls `/rpc/login`, stores `accessToken` in the existing auth service, and sends:

```http
Authorization: Bearer <accessToken>
```

The customer feature then calls `/customers` through PostgREST. PostgreSQL grants and RLS
remain the final security boundary.

## Not Implemented Yet

Refresh tokens, password reset, OAuth/OIDC, production identity provider integration, user
management UI, session revocation, and audit logging are intentionally outside this step.
