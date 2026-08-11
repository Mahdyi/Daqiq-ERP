# Payments PostgREST Contract

Step 34 adds cash/bank accounts, customer receipts, supplier payments, invoice allocations, payment accounting journals, and AR/AP settlement views.

## Local Smoke-Test Environment

Set values locally only. Never commit passwords, JWTs, or secrets.

```powershell
$env:PGRST_BASE_URL = "http://127.0.0.1:3500"
$env:SMOKE_ADMIN_EMAIL = "admin@erp.com"
$env:SMOKE_ADMIN_PASSWORD = "<local only>"
$env:SMOKE_ACCOUNTANT_EMAIL = "accountant@erp.com"
$env:SMOKE_ACCOUNTANT_PASSWORD = "<local only>"
$env:SMOKE_MANAGER_EMAIL = "manager@erp.com"
$env:SMOKE_MANAGER_PASSWORD = "<local only>"
$env:SMOKE_SALES_EMAIL = "sales@erp.com"
$env:SMOKE_SALES_PASSWORD = "<local only>"
$env:SMOKE_WAREHOUSE_EMAIL = "warehouse@erp.com"
$env:SMOKE_WAREHOUSE_PASSWORD = "<local only>"
$env:SMOKE_VIEWER_EMAIL = "viewer@erp.com"
$env:SMOKE_VIEWER_PASSWORD = "<local only>"
```

Run:

```powershell
powershell -ExecutionPolicy Bypass -File backend/postgrest/smoke-test-payments.ps1
```

## Read Endpoints

```text
GET /cash_bank_account_view
GET /customer_receipt_view
GET /customer_receipt_allocation_view?customer_receipt_id=eq.<uuid>
GET /supplier_payment_view
GET /supplier_payment_allocation_view?supplier_payment_id=eq.<uuid>
GET /sales_invoice_settlement_view
GET /supplier_invoice_settlement_view
```

List endpoints support PostgREST `Range-Unit: items`, `Range`, and `Prefer: count=exact`.

## Command RPCs

```text
POST /rpc/post_customer_receipt
POST /rpc/cancel_customer_receipt
POST /rpc/post_supplier_payment
POST /rpc/cancel_supplier_payment
```

Customer receipt request:

```json
{
  "customer_id": "...",
  "cash_bank_account_id": "...",
  "receipt_date": "2026-08-11",
  "currency_lookup_value_id": "...",
  "payment_method_lookup_value_id": "...",
  "amount": 500,
  "reference_number": "BANK-REF-001",
  "notes": "...",
  "allocations": [
    {
      "salesInvoiceId": "...",
      "allocatedAmount": 500
    }
  ]
}
```

Supplier payment request:

```json
{
  "supplier_id": "...",
  "cash_bank_account_id": "...",
  "payment_date": "2026-08-11",
  "currency_lookup_value_id": "...",
  "payment_method_lookup_value_id": "...",
  "amount": 300,
  "reference_number": "BANK-REF-002",
  "notes": "...",
  "allocations": [
    {
      "supplierInvoiceId": "...",
      "allocatedAmount": 300
    }
  ]
}
```

Payment and receipt numbers are generated in PostgreSQL. Posting creates a balanced accounting journal in the same transaction. Payments never update inventory balances or movements.

Posted cancellation reversal journals are deferred; cancellation RPCs currently reject posted records safely and are reserved for draft cancellation or a later reversal workflow.

## Security

`erp_admin` has full access. `erp_accountant` can read/post payments and create/update cash-bank accounts. `erp_manager` is read-only. Sales, warehouse, viewer, and anonymous roles have no payment access.

The backend enforces allocation rules, wrong-party blocking, over-allocation blocking, lookup validation, RLS, and explicit grants. Angular permissions are only a UX layer.

## Smoke-Test Coverage

The smoke test verifies:

* accountant can view cash/bank accounts
* accountant can post customer receipt and supplier payment when eligible invoice settlement rows exist
* payment journals are balanced and visible in the general ledger
* invoice remaining amounts decrease after payment
* over-allocation and wrong-party allocations are blocked
* payments do not create inventory movements
* manager can read but cannot post
* warehouse, sales, and viewer cannot read payments
* audit events are created
