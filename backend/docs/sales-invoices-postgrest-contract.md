# Sales Invoices PostgREST Contract

Sales invoices are commercial documents created from posted sales deliveries. They calculate invoice amounts and tax from delivered quantities, but they do not update inventory and do not create accounting postings in this foundation step.

## Endpoints

Read endpoints:

```text
GET /sales_invoice_view
GET /sales_invoice_view?id=eq.<uuid>
GET /sales_invoice_line_view?sales_invoice_id=eq.<uuid>
GET /sales_delivery_line_invoicing_view?sales_delivery_id=eq.<uuid>
GET /sales_delivery_invoicing_view?sales_delivery_id=eq.<uuid>
```

Command RPCs:

```text
POST /rpc/create_sales_invoice_from_delivery
POST /rpc/issue_sales_invoice
POST /rpc/cancel_sales_invoice
```

`api.sales_invoices` and `api.sales_invoice_lines` are protected tables. Feature code should use the views for reads and the RPCs for mutations.

## Create Invoice From Delivery

Request:

```json
{
  "sales_delivery_id": "uuid",
  "invoice_date": "2026-08-05",
  "due_date": "2026-09-04",
  "notes": "optional",
  "lines": [
    {
      "salesDeliveryLineId": "uuid",
      "quantity": 2,
      "unitPrice": 100,
      "taxRateLookupValueId": "uuid-or-null",
      "description": "optional"
    }
  ]
}
```

The backend generates `invoice_number`, validates the delivery is posted, verifies all requested lines belong to that delivery, blocks over-invoicing, calculates subtotal/tax/total, and returns the full invoice detail.

Cancelled deliveries cannot be invoiced. Cancelled invoices do not count toward invoicing progress.

## Issue Invoice

Request:

```json
{
  "sales_invoice_id": "uuid"
}
```

Only draft invoices can be issued. Issuing sets `status = issued`, records issuer information from JWT claims, and writes an audit event.

## Cancel Invoice

Request:

```json
{
  "sales_invoice_id": "uuid"
}
```

Draft and issued invoices can be cancelled by authorized roles. Cancellation records actor information and removes the invoice quantities from future invoicing progress.

## Permissions

| Role | View | Create | Update | Issue | Cancel | Delete |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `erp_admin` | yes | yes | yes | yes | yes | yes |
| `erp_manager` | yes | yes | yes | yes | yes | no |
| `erp_accountant` | yes | yes | yes | yes | yes | no |
| `erp_sales` | yes | yes | no | no | no | no |
| `erp_warehouse` | yes | no | no | no | no | no |
| `erp_viewer` | no | no | no | no | no | no |
| `erp_anon` | no | no | no | no | no | no |

Frontend permissions mirror this through:

```text
salesInvoices.view
salesInvoices.create
salesInvoices.update
salesInvoices.issue
salesInvoices.cancel
salesInvoices.delete
```

## Business Validation

- Invoice creation is allowed only from posted sales deliveries.
- Invoice lines must reference delivery lines on the selected delivery.
- Quantity must be positive.
- Quantity cannot exceed remaining delivered-but-not-invoiced quantity.
- Unit price must be non-negative.
- Tax rate, when provided, must reference an active `tax_rate` lookup value.
- Invoice totals are calculated in PostgreSQL, not Angular.
- Sales invoices do not update inventory balances.
- Sales invoices do not create accounting entries yet.

## Progress Views

`sales_delivery_line_invoicing_view` returns delivered, invoiced, and remaining quantity per delivery line. Draft and issued invoices count; cancelled invoices do not.

## Audit

The migration audits:

```text
salesInvoice.created
salesInvoice.issued
salesInvoice.cancelled
salesInvoice.overInvoiceBlocked
```

Metadata is intentionally small and excludes passwords, tokens, hashes, and secrets.
