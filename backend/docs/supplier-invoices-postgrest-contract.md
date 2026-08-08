# Supplier Invoices PostgREST Contract

Supplier invoices are accounts-payable intake documents created from posted goods receipts. They calculate invoice amounts and tax from received quantities, but they do not update inventory and do not create accounting or payment postings in this foundation step.

## Endpoints

Read endpoints:

```text
GET /supplier_invoice_view
GET /supplier_invoice_view?id=eq.<uuid>
GET /supplier_invoice_line_view?supplier_invoice_id=eq.<uuid>
GET /goods_receipt_line_supplier_invoicing_view?goods_receipt_id=eq.<uuid>
GET /goods_receipt_supplier_invoicing_view?goods_receipt_id=eq.<uuid>
```

Command RPCs:

```text
POST /rpc/create_supplier_invoice_from_receipt
POST /rpc/post_supplier_invoice
POST /rpc/cancel_supplier_invoice
```

`api.supplier_invoices` and `api.supplier_invoice_lines` are protected tables. Feature code should use the views for reads and the RPCs for mutations.

## Create Invoice From Receipt

Request:

```json
{
  "goods_receipt_id": "uuid",
  "supplier_invoice_number": "SUP-INV-1001",
  "invoice_date": "2026-08-07",
  "due_date": "2026-09-06",
  "notes": "optional",
  "lines": [
    {
      "goodsReceiptLineId": "uuid",
      "quantity": 2,
      "unitPrice": 100,
      "taxRateLookupValueId": "uuid-or-null",
      "description": "optional"
    }
  ]
}
```

The backend generates the internal `invoice_number`, validates the receipt is posted, verifies all requested lines belong to that receipt, blocks over-invoicing, calculates subtotal/tax/total, and returns the full invoice detail.

Cancelled goods receipts cannot be invoiced. Cancelled supplier invoices do not count toward invoicing progress.

## Post Invoice

Request:

```json
{
  "supplier_invoice_id": "uuid"
}
```

Only draft invoices can be posted. Posting records actor information from JWT claims and writes an audit event. It does not create accounting entries yet.

## Cancel Invoice

Request:

```json
{
  "supplier_invoice_id": "uuid"
}
```

Draft and posted invoices can be cancelled by authorized roles. Cancellation records actor information and removes the invoice quantities from future invoicing progress.

## Permissions

| Role | View | Create | Update | Post | Cancel | Delete |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `erp_admin` | yes | yes | yes | yes | yes | yes |
| `erp_manager` | yes | yes | yes | yes | yes | no |
| `erp_accountant` | yes | yes | yes | yes | yes | no |
| `erp_warehouse` | yes | no | no | no | no | no |
| `erp_sales` | no | no | no | no | no | no |
| `erp_viewer` | no | no | no | no | no | no |
| `erp_anon` | no | no | no | no | no | no |

Frontend permissions mirror this through:

```text
supplierInvoices.view
supplierInvoices.create
supplierInvoices.update
supplierInvoices.post
supplierInvoices.cancel
supplierInvoices.delete
```

## Business Validation

- Invoice creation is allowed only from posted goods receipts.
- Invoice lines must reference receipt lines on the selected receipt.
- Quantity must be positive.
- Quantity cannot exceed remaining received-but-not-invoiced quantity.
- Unit price must be non-negative.
- Tax rate, when provided, must reference an active `tax_rate` lookup value.
- Supplier invoice numbers are unique per supplier when provided.
- Invoice totals are calculated in PostgreSQL, not Angular.
- Supplier invoices do not update inventory balances.
- Supplier invoices do not create accounting entries, payment schedules, or payables ledger entries yet.

## Progress Views

`goods_receipt_line_supplier_invoicing_view` returns received, invoiced, and remaining quantity per goods receipt line. Draft and posted invoices count; cancelled invoices do not.

## Audit

The migration audits:

```text
supplierInvoice.created
supplierInvoice.posted
supplierInvoice.cancelled
supplierInvoice.overInvoiceBlocked
```

Metadata is intentionally small and excludes passwords, tokens, hashes, and secrets.
