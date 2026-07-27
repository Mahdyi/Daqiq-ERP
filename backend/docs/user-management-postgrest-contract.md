# User Management PostgREST Contract

This document describes the admin-only user-management API for Daqiq ERP.
The API exposes safe RPC functions through the `api` schema. Private auth tables remain in
the `private` schema and are never exposed directly through PostgREST.

## Security Boundary

Only `erp_admin` receives execute grants for user-management RPCs. Anonymous users and
non-admin database roles cannot list, create, update, reset passwords, activate, or deactivate
users.

The API never returns:

- `password_hash`
- `refresh_token_hash`
- JWT tokens
- internal database role claims

Password reset and user deactivation revoke active refresh sessions for the affected user.

## Returned User Shape

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "email": "admin@erp.com",
  "displayName": "مدیر سیستم",
  "active": true,
  "roles": ["admin"],
  "createdAt": "2026-07-27T10:00:00Z",
  "updatedAt": "2026-07-27T10:00:00Z",
  "lastLoginAt": null
}
```

## RPC Endpoints

### List Users

```http
POST /rpc/admin_list_users
Authorization: Bearer <erp_admin access token>
Content-Type: application/json
```

Request:

```json
{
  "search": "admin",
  "active": true,
  "page_number": 1,
  "page_size": 20
}
```

Response:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "totalItems": 0,
  "totalPages": 0
}
```

Search matches email or display name case-insensitively. `active` may be omitted or `null`.

### Get User

```http
POST /rpc/admin_get_user
```

Request:

```json
{
  "user_id": "<uuid>"
}
```

Returns one safe user record.

### Create User

```http
POST /rpc/admin_create_user
```

Request:

```json
{
  "email": "new.user@example.com",
  "display_name": "کاربر جدید",
  "password": "change-me-strong",
  "app_roles": ["viewer"],
  "active": true
}
```

Email and display name must not be blank. Password is hashed with pgcrypto and is never
returned. Email is unique case-insensitively.

### Update User

```http
POST /rpc/admin_update_user
```

Request:

```json
{
  "user_id": "<uuid>",
  "email": "updated.user@example.com",
  "display_name": "کاربر ویرایش‌شده",
  "active": true,
  "app_roles": ["manager"]
}
```

Role values must be one of:

```text
admin, manager, accountant, sales, warehouse, viewer
```

Changing roles or deactivating the user revokes active refresh sessions for that user.

### Reset Password

```http
POST /rpc/admin_reset_user_password
```

Request:

```json
{
  "user_id": "<uuid>",
  "new_password": "new-strong-password"
}
```

The new password is stored only as a pgcrypto hash. Active refresh sessions are revoked.

### Activate / Deactivate

```http
POST /rpc/admin_activate_user
POST /rpc/admin_deactivate_user
```

Request:

```json
{
  "user_id": "<uuid>"
}
```

Deactivation revokes active refresh sessions and prevents future login/refresh.

## Error Behavior

- non-admin role: `401`, `403`, or PostgREST permission error
- duplicate email: unique constraint conflict
- invalid role: validation error
- blank email/display/password: validation error
- unknown user id: not-found style error

The frontend maps PostgREST errors through the existing typed `ApiError` infrastructure.

## Non-Goals

This step does not implement self-registration, forgot-password email flow, MFA, audit-log UI,
session/device management UI, OAuth/OIDC, or production identity-provider integration.
