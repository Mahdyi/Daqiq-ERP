# Inventory Balances And Stock Movements PostgREST Contract

This document describes the approved PostgREST surface for inventory balances and inventory
movements. Inventory is controlled by PostgreSQL constraints, grants, RLS, and RPC functions.
Angular must never edit balances directly.

## Read Endpoints

```text
GET /inventory_balance_view
GET /inventory_movement_view
```

Use PostgREST range pagination:

```text
Range-Unit: items
Range: 0-19
Prefer: count=exact
```

The total count is read from `Content-Range`.

## Transaction RPCs

```text
POST /rpc/inventory_adjust_in
POST /rpc/inventory_adjust_out
POST /rpc/inventory_transfer
```

Adjustment request:

```json
{
  "product_id": "uuid",
  "warehouse_id": "uuid",
  "storage_location_id": "uuid-or-null",
  "quantity": 10,
  "reason": "Opening count correction"
}
```

Transfer request:

```json
{
  "product_id": "uuid",
  "from_warehouse_id": "uuid",
  "from_storage_location_id": "uuid-or-null",
  "to_warehouse_id": "uuid",
  "to_storage_location_id": "uuid-or-null",
  "quantity": 5,
  "reason": "Move to picking area"
}
```

Adjustments return one movement object. Transfers return:

```json
{
  "outMovement": {},
  "inMovement": {}
}
```

Movement numbers are generated in PostgreSQL using the `documents.inventoryMovementPrefix`
system setting and a private sequence.

## Balance Rules

- Balances are derived and maintained only through movement RPCs.
- `api.inventory_movements` is append-only.
- Direct balance edits are not granted to application roles.
- Product must be active and `track_inventory = true`.
- Movement unit is the product base unit.
- Warehouses and storage locations must be active.
- A storage location must belong to the selected warehouse.
- Quantity must be positive.
- Source and destination cannot be identical for transfers.
- Negative stock is blocked when `inventory.allowNegativeStock = false`.

## Authorization

PostgreSQL grants and RLS are authoritative:

| Database role    | Read balances/movements | Adjust | Transfer | Delete |
| ---------------- | ----------------------: | -----: | -------: | -----: |
| `erp_admin`      | yes                     | yes    | yes      | no direct delete |
| `erp_manager`    | yes                     | yes    | yes      | no |
| `erp_warehouse`  | yes                     | yes    | yes      | no |
| `erp_accountant` | yes                     | no     | no       | no |
| `erp_sales`      | no                      | no     | no       | no |
| `erp_viewer`     | no                      | no     | no       | no |
| `erp_anon`       | no                      | no     | no       | no |

Frontend permissions mirror this:

```text
inventory.view
inventory.adjust
inventory.transfer
inventory.delete
```

`inventory.delete` is reserved for future reversal/correction workflows. Step 26 does not
physically delete inventory movements.

## Audit

The backend writes audit events for:

```text
inventory.adjustment_in
inventory.adjustment_out
inventory.transfer
inventory.negative_stock_blocked
```

Audit metadata is sanitized and limited to safe operational identifiers such as movement IDs,
movement number, product ID, warehouse IDs, storage-location IDs, quantity, and active state.
Tokens, passwords, hashes, JWTs, and secrets must never be stored.

## Error Cases

Important validation failures include:

- duplicate or invalid movement data
- inactive product, warehouse, or storage location
- non-inventory-tracked product
- wrong warehouse for a storage location
- negative stock blocked by setting
- unauthorized role attempting mutation

PostgREST returns PostgreSQL/PostgREST error payloads with fields such as `code`, `message`,
`details`, and `hint`. Angular maps these through the typed `ApiError` infrastructure.

## Non-Goals

This step does not implement purchasing, receiving, issuing, shipping, reservations, lots,
serial numbers, costing, valuation, or accounting entries.
