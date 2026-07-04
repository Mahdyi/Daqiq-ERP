# Customers PostgREST Contract

This contract documents the first persistent ERP resource exposed through PostgREST.

Production data path:

```text
Angular ERP -> HTTPS REST -> PostgREST -> PostgreSQL RLS/constraints
```

Angular must never connect directly to PostgreSQL.

## Resource

PostgREST exposes only the `api` schema. The customers resource is:

```text
api.customers
```

Public API surface:

```text
GET    /customers
GET    /customers?id=eq.<uuid>
POST   /customers
PATCH  /customers?id=eq.<uuid>
DELETE /customers?id=eq.<uuid>
```

## Columns

```text
id uuid
code text
name text
email text | null
phone text | null
customer_type text: individual | corporate
credit_limit numeric(14,2) | null
active boolean
created_at timestamptz
updated_at timestamptz
```

Request and response bodies use the database/API column names above.

## List

Example:

```http
GET /customers?active=eq.true&order=created_at.desc,id.asc
Range-Unit: items
Range: 0-24
Prefer: count=exact
Authorization: Bearer <token>
```

Expected behavior:

- Response body is a raw JSON array from PostgREST.
- Pagination uses `Range-Unit: items` and `Range: start-end`.
- Total count is read from `Content-Range` when `Prefer: count=exact` is used.
- Allowed ordering fields for frontend usage should be limited to `code`, `name`, `created_at`, `updated_at`, and `active`.
- Active filtering should use `active=eq.true` or `active=eq.false`.
- Safe text search should use PostgREST filters such as `name=ilike.*term*` or `code=ilike.*term*`; frontend code must escape user-supplied filter syntax before building URLs.

## Create

Example:

```http
POST /customers
Prefer: return=representation
Content-Type: application/json
Authorization: Bearer <token>

{
  "code": "CUST-9001",
  "name": "شرکت نمونه",
  "customer_type": "corporate",
  "credit_limit": 10000000,
  "active": true
}
```

Writes with `Prefer: return=representation` return the created row as a raw JSON array.

Duplicate customer codes return a conflict response because customer code is unique case-insensitively.

## Update

Example:

```http
PATCH /customers?id=eq.<uuid>
Prefer: return=representation
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "نام ویرایش‌شده"
}
```

Writes with `Prefer: return=representation` return the updated row as a raw JSON array.

## Delete

Example:

```http
DELETE /customers?id=eq.<uuid>
Authorization: Bearer <token>
```

Delete must use a restrictive ID filter. Default PostgREST behavior may return minimal content, so frontend code should not assume success unless the HTTP status and affected-row expectations are handled deliberately.

## Errors

PostgREST returns PostgreSQL/PostgREST error payloads with fields such as:

```text
code
message
details
hint
```

Important cases:

```text
401/403 -> authentication or authorization failure
404     -> missing resource or route
409     -> unique or foreign-key conflict where applicable
422     -> validation handling when used by backend conventions
```

Database constraints enforce:

- non-blank `code`
- non-blank `name`
- valid `customer_type`
- non-negative `credit_limit`
- no credit limit for individual customers
- case-insensitive unique customer code

## Role Claim

PostgREST expects the JWT role claim to contain the PostgreSQL database role:

```json
{
  "role": "erp_admin"
}
```

The future authentication issuer may also include application-facing claims such as:

```json
{
  "app_roles": ["admin"],
  "user_id": "..."
}
```

No token values or signing secrets belong in repository files.

## Authorization Matrix

PostgreSQL grants and RLS policies are both used. Frontend route guards are not a security boundary.

| Database role | SELECT | INSERT | UPDATE | DELETE |
| --- | ---: | ---: | ---: | ---: |
| `erp_admin` | yes | yes | yes | yes |
| `erp_manager` | yes | yes | yes | no |
| `erp_sales` | yes | yes | yes | no |
| `erp_accountant` | yes | no | no | no |
| `erp_warehouse` | no | no | no | no |
| `erp_viewer` | no | no | no | no |
| `erp_anon` | no | no | no | no |
