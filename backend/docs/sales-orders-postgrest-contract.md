# Sales Orders PostgREST Contract

This document describes the approved API surface for sales orders. Sales orders capture
customer commercial intent only. Creating or confirming a sales order does not reserve stock,
ship goods, create invoices, or post accounting entries.

## Read Endpoints

```text
GET /sales_order_view
GET /sales_order_view?id=eq.<uuid>
GET /sales_order_line_view?sales_order_id=eq.<uuid>
GET /product_stock_availability_view
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
POST /rpc/create_sales_order
POST /rpc/update_sales_order
POST /rpc/submit_sales_order
POST /rpc/confirm_sales_order
POST /rpc/cancel_sales_order
POST /rpc/close_sales_order
```

Create/update request shape:

```json
{
  "customer_id": "uuid",
  "order_date": "2026-08-04",
  "requested_delivery_date": "2026-08-20",
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
  "sales_order_id": "uuid"
}
```

RPCs return one sales-order object. Line totals are calculated in PostgreSQL. The frontend may
show estimated totals while editing, but persisted database values are authoritative.

## Workflow

Valid status flow:

```text
draft -> submitted -> confirmed -> closed
draft/submitted/confirmed -> cancelled
```

Only draft orders can be edited. Confirmed sales orders do not create inventory movements in
this step. Shipping, delivery, reservation, invoicing, and accounting are later workflows.

## Backend Validation

- Customer must be active.
- Product must be active and sellable.
- Line unit must match the product base unit.
- Currency must be an active `currency` lookup value.
- Tax rate must be an active `tax_rate` lookup value.
- Delivery warehouse must be active when provided.
- Requested delivery date must be empty or on/after order date.
- Quantity must be greater than zero.
- Unit price and calculated amounts cannot be negative.
- Sales order must contain at least one line.

## Authorization

PostgreSQL grants and RLS are authoritative:

| Database role    | Read | Create | Update Draft | Submit | Confirm | Cancel | Close |
| ---------------- | ---: | -----: | -----------: | -----: | ------: | -----: | ----: |
| `erp_admin`      | yes  | yes    | yes          | yes    | yes     | yes    | yes   |
| `erp_manager`    | yes  | yes    | yes          | yes    | yes     | yes    | no    |
| `erp_sales`      | yes  | yes    | yes          | yes    | no      | yes    | no    |
| `erp_warehouse`  | yes  | no     | no           | no     | no      | no     | no    |
| `erp_accountant` | yes  | no     | no           | no     | no      | no     | no    |
| `erp_viewer`     | no   | no     | no           | no     | no      | no     | no    |
| `erp_anon`       | no   | no     | no           | no     | no      | no     | no    |

Frontend permissions mirror this with:

```text
salesOrders.view
salesOrders.create
salesOrders.update
salesOrders.submit
salesOrders.confirm
salesOrders.cancel
salesOrders.delete
```

`salesOrders.delete` is reserved for the admin close lifecycle capability in this foundation.

## Audit

The backend writes sanitized audit events for:

```text
salesOrder.created
salesOrder.updated
salesOrder.submitted
salesOrder.confirmed
salesOrder.cancelled
salesOrder.closed
```

Audit metadata is limited to safe identifiers and totals such as order number, customer id/name,
status, total amount, and line count. Tokens, passwords, hashes, JWTs, and secrets must never be
stored.

## Non-Goals

This step does not implement quotations, reservations, shipping, delivery notes, sales invoices,
payment collection, accounting entries, document printing, customer credit control, or email
dispatch.
