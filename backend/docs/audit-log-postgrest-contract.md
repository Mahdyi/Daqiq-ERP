# Audit Log PostgREST Contract

Audit logging records important security and business events in PostgreSQL. The private table is
not exposed directly through PostgREST. Admin users read audit entries through safe RPCs only.

## Storage

Private table:

```text
private.audit_logs
```

The table records actor information, database role, action, entity, outcome, summary, request
context, and sanitized metadata.

Sensitive metadata keys are removed before insert and again before API output:

```text
password, new_password, old_password, accessToken, refreshToken, token, authorization,
password_hash, refresh_token_hash, jwt, secret
```

## Audited Events

Authentication:

- `auth.login.success`
- `auth.login.failure`
- `auth.logout`
- `auth.refresh.success`
- `auth.refresh.failure`
- `auth.refresh.reuse_detected`
- `auth.refresh.expired_attempt`
- `auth.refresh.revoked_attempt`

User management:

- `user.created`
- `user.updated`
- `user.activated`
- `user.deactivated`
- `user.password_reset`
- `user.roles_changed`

Customers:

- `customer.created`
- `customer.updated`
- `customer.deleted`

Customer events are recorded by PostgreSQL triggers on `api.customers`, so normal PostgREST
table writes are covered.

## Read API

Only `erp_admin` can execute audit log read RPCs.

### List Audit Logs

```http
POST /rpc/admin_list_audit_logs
Authorization: Bearer <erp_admin access token>
Content-Type: application/json
```

Request:

```json
{
  "search": "login",
  "actor_user_id": null,
  "action": null,
  "entity_type": null,
  "outcome": "success",
  "date_from": null,
  "date_to": null,
  "page_number": 1,
  "page_size": 20
}
```

Response:

```json
{
  "items": [
    {
      "id": "...",
      "occurredAt": "2026-07-27T10:00:00Z",
      "actorUserId": "...",
      "actorEmail": "admin@erp.com",
      "actorRoles": ["admin"],
      "dbRole": "erp_admin",
      "action": "user.created",
      "entityType": "user",
      "entityId": "...",
      "outcome": "success",
      "summary": "User created",
      "metadata": {},
      "ipAddress": null,
      "userAgent": "...",
      "requestId": "..."
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

### Get Audit Log

```http
POST /rpc/admin_get_audit_log
Authorization: Bearer <erp_admin access token>
Content-Type: application/json
```

Request:

```json
{
  "log_id": "<uuid>"
}
```

Returns one safe audit log record.

## Security Guarantees

- The audit table is private.
- Only admin can read audit logs.
- Metadata is sanitized on write and read.
- Passwords, tokens, JWTs, and hashes are not stored in metadata.
- The Angular UI also sanitizes metadata defensively before display.

## Non-Goals

This step does not include export, retention policy UI, SIEM integration, anomaly detection,
session/device UI, alerting, or multi-tenant audit isolation.
