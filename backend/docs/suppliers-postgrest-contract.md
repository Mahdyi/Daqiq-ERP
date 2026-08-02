# Supplier Master Data PostgREST Contract

This document describes the approved PostgREST surface for supplier master data.
Angular must access suppliers only through HTTPS/PostgREST. It must never connect
directly to PostgreSQL.

## Resource

```text
api.suppliers
```

Exposed endpoints:

```text
GET    /suppliers
GET    /suppliers?id=eq.<uuid>
POST   /suppliers
PATCH  /suppliers?id=eq.<uuid>
DELETE /suppliers?id=eq.<uuid>
```

## Columns

Supplier responses use database/API column names:

```json
{
  "id": "uuid",
  "code": "SUP-LOCAL-001",
  "name": "تأمین فولاد سپهر",
  "email": "steel.sepehr@example.test",
  "phone": "021-44001001",
  "tax_number": "4111111111",
  "contact_person": "آقای احمدی",
  "website": "https://steel-sepehr.example.test",
  "address": "تهران، شهرک صنعتی شمس‌آباد",
  "supplier_group_lookup_value_id": "uuid",
  "currency_lookup_value_id": "uuid",
  "payment_terms_days": 30,
  "active": true,
  "created_at": "2026-08-02T00:00:00Z",
  "updated_at": "2026-08-02T00:00:00Z"
}
```

The table never contains credentials, tokens, password hashes, refresh-token
hashes, or secret configuration values.

## Listing

Use standard PostgREST range pagination:

```text
GET /suppliers?select=...&order=created_at.desc,id.asc
Range-Unit: items
Range: 0-19
Prefer: count=exact
```

Total records are read from `Content-Range`.

Recommended filters:

```text
active=eq.true
supplier_group_lookup_value_id=eq.<uuid>
currency_lookup_value_id=eq.<uuid>
or=(code.ilike.*term*,name.ilike.*term*,email.ilike.*term*,phone.ilike.*term*,tax_number.ilike.*term*,contact_person.ilike.*term*)
```

Allowed ordering fields should be whitelisted by clients. The Angular supplier
feature currently whitelists safe supplier columns only.

## Create And Update

Writes use JSON request bodies with database column names.

```http
POST /suppliers
Prefer: return=representation
```

```json
{
  "code": "SUP-NEW-001",
  "name": "New Supplier",
  "email": "supplier@example.test",
  "phone": "021-00000000",
  "tax_number": null,
  "contact_person": "Contact Name",
  "website": null,
  "address": null,
  "supplier_group_lookup_value_id": "uuid",
  "currency_lookup_value_id": "uuid",
  "payment_terms_days": 30,
  "active": true
}
```

Database validation enforces:

- supplier code is unique case-insensitively
- code and name are nonblank
- email must be valid when provided
- payment terms must be null or nonnegative
- supplier group lookup values must belong to `supplier_group`
- currency lookup values must belong to `currency`
- new or changed lookup references must point to active lookup values

Duplicate supplier code returns a conflict-style database/PostgREST error.

## Delete

```http
DELETE /suppliers?id=eq.<uuid>
Prefer: return=representation
```

Delete is intentionally restricted to `erp_admin`. Future purchasing documents may
require replacing physical delete with deactivation.

## Authorization

PostgreSQL grants and RLS policies enforce the final security boundary:

| Database role    | SELECT | INSERT | UPDATE | DELETE |
| ---------------- | -----: | -----: | -----: | -----: |
| `erp_admin`      | yes    | yes    | yes    | yes    |
| `erp_manager`    | yes    | yes    | yes    | no     |
| `erp_accountant` | yes    | no     | yes    | no     |
| `erp_warehouse`  | yes    | no     | no     | no     |
| `erp_sales`      | no     | no     | no     | no     |
| `erp_viewer`     | no     | no     | no     | no     |
| `erp_anon`       | no     | no     | no     | no     |

Frontend permissions mirror this matrix:

```text
suppliers.view
suppliers.create
suppliers.update
suppliers.delete
```

Frontend route guards and hidden buttons are convenience controls. PostgreSQL RLS
and grants are authoritative.

## Audit

Supplier mutations write sanitized audit events:

```text
supplier.created
supplier.updated
supplier.activated
supplier.deactivated
supplier.deleted
```

Safe metadata may include supplier code, name, active state, supplier-group
lookup ID, and currency lookup ID. Tokens, credentials, hashes, JWTs, and secrets
must never be stored in audit metadata.

## Feature Flag

`suppliers.enabled` is set to `true` by the supplier migration because this step
implements the module. Permission checks remain required even when the flag is
enabled.

## Non-Goals

This contract does not implement purchase orders, supplier product pricing,
supplier scoring, contracts, accounts payable, payment processing, attachments,
receiving, supplier portal access, or supplier self-service.
