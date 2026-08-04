# Purchase Orders PostgREST Contract

This document describes the approved API surface for purchasing purchase orders. Purchase
orders capture commercial intent only. They do not receive stock, post inventory movements,
create supplier invoices, or post accounting entries.

## Read Endpoints

```text
GET /purchase_order_view
GET /purchase_order_view?id=eq.<uuid>
GET /purchase_order_line_view?purchase_order_id=eq.<uuid>
```

Use PostgREST range pagination for lists:

```text
Range-Unit: items
Range: 0-19
Prefer: count=exact
```

Angular reads the total count from `Content-Range`.

## Mutation RPCs

```text
POST /rpc/create_purchase_order
POST /rpc/update_purchase_order
POST /rpc/submit_purchase_order
POST /rpc/approve_purchase_order
POST /rpc/cancel_purchase_order
POST /rpc/close_purchase_order
```

Create/update request shape:

```json
{
  "supplier_id": "uuid",
  "order_date": "2026-08-04",
  "expected_date": "2026-08-20",
  "currency_lookup_value_id": "uuid-or-null",
  "delivery_warehouse_id": "uuid-or-null",
  "notes": "optional note",
  "lines": [
    {
      "product_id": "uuid",
      "description": "optional line description",
      "quantity": 2,
      "unit_lookup_value_id": "uuid",
      "unit_price": 100,
      "tax_rate_lookup_value_id": "uuid-or-null"
    }
  ]
}
```

Transition request shape:

```json
{
  "purchase_order_id": "uuid"
}
```

RPCs return one purchase-order object. Line totals are calculated in PostgreSQL. The frontend
may show estimated totals while editing, but the persisted database values are authoritative.

## Workflow

Valid status flow:

```text
draft -> submitted -> approved -> closed
draft/submitted/approved -> cancelled
```

Only draft orders can be edited. Approved purchase orders do not create inventory movements in
this step. Receiving and inventory posting belong to a later receiving workflow.

## Backend Validation

- Supplier must be active.
- Product must be active and purchasable.
- Line unit must match the product base unit.
- Currency must be an active `currency` lookup value.
- Tax rate must be an active `tax_rate` lookup value.
- Delivery warehouse must be active when provided.
- Expected date must be empty or on/after order date.
- Quantity must be greater than zero.
- Unit price and calculated amounts cannot be negative.
- Purchase order must contain at least one line.

## Authorization

PostgreSQL grants and RLS are authoritative:

| Database role    | Read | Create | Update Draft | Submit | Approve | Cancel | Close |
| ---------------- | ---: | -----: | -----------: | -----: | ------: | -----: | ----: |
| `erp_admin`      | yes  | yes    | yes          | yes    | yes     | yes    | yes   |
| `erp_manager`    | yes  | yes    | yes          | yes    | yes     | yes    | no    |
| `erp_accountant` | yes  | no     | no           | no     | no      | no     | no    |
| `erp_warehouse`  | yes  | no     | no           | no     | no      | no     | no    |
| `erp_sales`      | no   | no     | no           | no     | no      | no     | no    |
| `erp_viewer`     | no   | no     | no           | no     | no      | no     | no    |
| `erp_anon`       | no   | no     | no           | no     | no      | no     | no    |

Frontend permissions mirror this with:

```text
purchasing.view
purchasing.create
purchasing.update
purchasing.submit
purchasing.approve
purchasing.cancel
purchasing.delete
```

`purchasing.delete` is reserved for the close/admin lifecycle capability in this foundation.

## Audit

The backend writes sanitized audit events for:

```text
purchaseOrder.created
purchaseOrder.updated
purchaseOrder.submitted
purchaseOrder.approved
purchaseOrder.cancelled
purchaseOrder.closed
```

Audit metadata is limited to safe identifiers and totals such as order number, supplier id/name,
status, total amount, and line count. Tokens, passwords, hashes, JWTs, and secrets must never be
stored.

## Non-Goals

This step does not implement purchase requisitions, receiving goods, inventory posting, supplier
invoices, payment processing, accounting entries, document printing, or email dispatch.
