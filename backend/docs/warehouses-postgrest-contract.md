# Warehouse And Storage Location PostgREST Contract

This document describes the approved PostgREST surface for warehouse and storage-location
master data. This step defines where inventory may live later; it does not create stock
balances, movements, receiving, transfers, shipping, valuation, or reservations.

## Endpoints

```text
GET    /warehouses
GET    /warehouses?id=eq.<uuid>
POST   /warehouses
PATCH  /warehouses?id=eq.<uuid>
DELETE /warehouses?id=eq.<uuid>

GET    /storage_locations
GET    /storage_locations?id=eq.<uuid>
POST   /storage_locations
PATCH  /storage_locations?id=eq.<uuid>
DELETE /storage_locations?id=eq.<uuid>
```

## Warehouses

Rows use database/API column names:

```json
{
  "id": "uuid",
  "code": "WH-MAIN",
  "name": "انبار اصلی",
  "description": "مرکز نگهداری عمومی کالاها",
  "warehouse_type_lookup_value_id": "uuid",
  "address": "تهران، سایت مرکزی",
  "responsible_person": "آقای انصاری",
  "phone": "021-88001001",
  "email": "main-warehouse@example.test",
  "active": true,
  "created_at": "2026-08-02T00:00:00Z",
  "updated_at": "2026-08-02T00:00:00Z"
}
```

Validation:

- code is unique case-insensitively
- code and name are nonblank
- email must be valid when provided
- warehouse type must reference an active `warehouse_type` lookup value when changed

## Storage Locations

```json
{
  "id": "uuid",
  "warehouse_id": "uuid",
  "code": "A-R01",
  "name": "قفسه A-01",
  "description": null,
  "location_type_lookup_value_id": "uuid",
  "parent_location_id": "uuid",
  "active": true,
  "created_at": "2026-08-02T00:00:00Z",
  "updated_at": "2026-08-02T00:00:00Z"
}
```

Validation:

- code is unique per warehouse case-insensitively
- code and name are nonblank
- parent location cannot equal the same row
- parent location must belong to the same warehouse
- location type must reference an active `storage_location_type` lookup value when changed

## Pagination, Search, And Sort

Use PostgREST range pagination:

```text
Range-Unit: items
Range: 0-19
Prefer: count=exact
```

Total records are read from `Content-Range`.

Warehouse search may include code, name, description, responsible person, phone, and email.
Storage-location search may include code, name, and description. Angular clients should use
strict sort whitelists and not pass arbitrary column names.

## Authorization

PostgreSQL grants and RLS policies are authoritative:

| Database role    | SELECT | INSERT | UPDATE | DELETE |
| ---------------- | -----: | -----: | -----: | -----: |
| `erp_admin`      | yes    | yes    | yes    | yes    |
| `erp_manager`    | yes    | yes    | yes    | no     |
| `erp_warehouse`  | yes    | yes    | yes    | no     |
| `erp_accountant` | yes    | no     | no     | no     |
| `erp_sales`      | no     | no     | no     | no     |
| `erp_viewer`     | no     | no     | no     | no     |
| `erp_anon`       | no     | no     | no     | no     |

Frontend permissions mirror this:

```text
warehouses.view/create/update/delete
storageLocations.view/create/update/delete
```

## Audit

Warehouse events:

```text
warehouse.created
warehouse.updated
warehouse.activated
warehouse.deactivated
warehouse.deleted
```

Storage-location events:

```text
storageLocation.created
storageLocation.updated
storageLocation.activated
storageLocation.deactivated
storageLocation.deleted
```

Audit metadata is sanitized and limited to safe fields such as code, name, warehouse ID,
active state, and type lookup IDs. Tokens, credentials, hashes, JWTs, and secrets must never
be stored.

## Feature Flag

The migration adds and enables `warehouses.enabled`. Permission guards remain the true
security control.
