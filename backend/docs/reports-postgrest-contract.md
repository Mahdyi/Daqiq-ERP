# Reports PostgREST Contract

Step 38 exposes read-only operational reporting views through the `api` schema.

Reports are summaries, not a generic report builder. PostgreSQL owns the calculations and PostgREST exposes them as queryable views. Angular may filter and render rows, but it must not recalculate trusted business totals.

## Views

Inventory:

- `GET /report_inventory_on_hand_view`
- `GET /report_inventory_movement_summary_view`

Purchasing:

- `GET /report_purchase_order_status_view`
- `GET /report_goods_receipt_status_view`
- `GET /report_supplier_invoice_settlement_view`

Sales:

- `GET /report_sales_order_status_view`
- `GET /report_sales_delivery_status_view`
- `GET /report_sales_invoice_settlement_view`

Accounting:

- `GET /report_general_ledger_summary_view`
- `GET /report_journal_activity_view`

Payments:

- `GET /report_payment_summary_view`

Audit:

- `GET /report_audit_activity_summary_view`

## Access

| Role | Reports |
| --- | --- |
| `erp_admin` | all reports |
| `erp_manager` | inventory, purchasing, sales, payment summary |
| `erp_accountant` | invoice settlement, accounting, payment summary |
| `erp_warehouse` | inventory only |
| `erp_sales` | sales only |
| `erp_viewer` | none |
| `erp_anon` | none |

Angular permissions mirror this with `reports.view` and category-specific report permissions.

Frontend permissions protect navigation and routes. PostgreSQL grants remain the backend access boundary.

## Querying

Use normal PostgREST read conventions:

```http
Range-Unit: items
Range: 0-19
Prefer: count=exact
Authorization: Bearer <access-token>
```

Examples:

```text
GET /report_inventory_on_hand_view?warehouse_id=eq.<uuid>&order=product_name.asc
GET /report_sales_invoice_settlement_view?total_remaining_amount=gt.0
GET /report_general_ledger_summary_view?order=account_code.asc
```

## Read-Only Behavior

Report resources are views and are not intended for mutation. No report mutation RPCs are exposed.

## Smoke Test

```powershell
$env:PGRST_BASE_URL = "http://127.0.0.1:3500"
powershell -ExecutionPolicy Bypass -File backend/postgrest/smoke-test-reports.ps1
```

The script verifies role access, blocked access, numeric report fields, read-only behavior, and absence of a report mutation RPC.

Never commit passwords, JWTs, refresh tokens, or local environment files.
