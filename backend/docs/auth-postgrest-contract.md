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
  "refreshToken": "<opaque refresh token>",
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

### Refresh Session

```http
POST /rpc/refresh_session
Content-Type: application/json
```

Request:

```json
{
  "refresh_token": "<opaque refresh token>"
}
```

Successful response uses the same shape as login and includes a new access token and a new
refresh token. Refresh tokens rotate on every successful refresh. The old refresh session is
marked as rotated and cannot be used again.

If a rotated refresh token is reused, PostgreSQL marks reuse detection on the old session,
revokes the entire token family, and returns a generic authentication error. This is a
compromise signal: the client must clear the local session and require login again.

### Logout

```http
POST /rpc/logout
Content-Type: application/json
```

Request:

```json
{
  "refresh_token": "<opaque refresh token>"
}
```

Response:

```json
{
  "success": true
}
```

Logout revokes the matching refresh session if it exists. It does not reveal whether the token
was known. Angular must clear the local session even if the network logout call fails.

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

The access token is signed with HS256 and contains a PostgREST database role claim:

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

## Token Lifetimes and Storage

Current local-development lifetimes:

| Token | Lifetime | Storage |
| --- | ---: | --- |
| Access token | 60 minutes | Angular session storage |
| Refresh token | 7 days | Angular session storage; PostgreSQL stores only a SHA-256 hash |

Refresh tokens are returned in JSON for this local-development architecture. For production,
prefer a hardened secure-cookie strategy where feasible: `HttpOnly`, `Secure`, strict
same-site policy, TLS-only transport, CSRF protection where relevant, and centralized session
revocation monitoring.

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

Angular calls `/rpc/login`, stores the access and refresh token in the existing auth service,
and sends only the access token as:

```http
Authorization: Bearer <accessToken>
```

The customer feature then calls `/customers` through PostgREST. PostgreSQL grants and RLS
remain the final security boundary.

When an access token expires, Angular may call `/rpc/refresh_session` with the refresh token.
It must never send the refresh token as a Bearer token.

## Not Implemented Yet

Password reset, OAuth/OIDC, production identity provider integration, user management UI,
session-management UI, logout-all UI, MFA, and audit logging are intentionally outside this
step.
