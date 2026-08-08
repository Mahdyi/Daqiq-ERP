# Accounting PostgREST Contract

This document describes the Step 33 accounting foundation. Angular must access this surface through
the configured PostgREST endpoint and must send a valid `Authorization: Bearer <accessToken>` header.

## Exposed Read Views

```text
GET /gl_account_view
GET /accounting_period_view
GET /journal_entry_view
GET /journal_entry_line_view
GET /general_ledger_view
```

Use PostgREST pagination headers for lists:

```text
Range-Unit: items
Range: 0-19
Prefer: count=exact
```

`general_ledger_view` contains posted journal lines only. Draft and cancelled journals are not part of
the general ledger.

## Commands

```text
POST /rpc/create_manual_journal_entry
POST /rpc/post_journal_entry
POST /rpc/cancel_journal_entry
POST /rpc/post_sales_invoice_accounting
POST /rpc/post_supplier_invoice_accounting
```

### Create Manual Journal

```json
{
  "journal_date": "2026-08-08",
  "description": "Manual adjustment",
  "currency_lookup_value_id": null,
  "lines": [
    {
      "accountId": "uuid",
      "description": "Debit line",
      "debitAmount": 100,
      "creditAmount": 0
    },
    {
      "accountId": "uuid",
      "description": "Credit line",
      "debitAmount": 0,
      "creditAmount": 100
    }
  ]
}
```

Creation starts in `draft`. Posting is a separate command and is blocked unless debit equals credit,
the journal has at least two lines, and the journal date belongs to an open accounting period.

### Invoice Posting

Sales invoice posting:

- invoice must be `issued`
- creates a balanced posted journal
- debits Accounts Receivable
- credits Sales Revenue
- credits Output Tax when tax is present
- does not change inventory

Supplier invoice posting:

- invoice must be `posted`
- creates a balanced posted journal
- debits Purchase Expense
- debits Input Tax when tax is present
- credits Accounts Payable
- does not change inventory

Default accounts are resolved from `api.system_settings` by account code:

```text
accounting.defaultAccounts.accountsReceivable
accounting.defaultAccounts.accountsPayable
accounting.defaultAccounts.salesRevenue
accounting.defaultAccounts.purchaseExpense
accounting.defaultAccounts.inputTax
accounting.defaultAccounts.outputTax
accounting.defaultAccounts.inventoryClearing
```

Duplicate invoice posting is blocked by `api.accounting_source_links`.

## Permissions

```text
erp_admin      read/write/post/cancel all accounting resources
erp_accountant operational accounting access and chart/period maintenance
erp_manager    read-only accounting access
other roles    no accounting access
erp_anon       no accounting access
```

PostgreSQL grants and RLS policies enforce this independently of frontend route guards.

## Audit Events

The backend writes audit events for:

```text
glAccount.created
glAccount.updated
glAccount.deactivated
accountingPeriod.updated
journalEntry.created
journalEntry.posted
journalEntry.cancelled
accounting.salesInvoicePosted
accounting.supplierInvoicePosted
accounting.duplicatePostingBlocked
accounting.unbalancedJournalBlocked
accounting.closedPeriodBlocked
```

Audit metadata contains accounting identifiers, totals, account codes, period codes, and source IDs.
It must not contain passwords, tokens, secrets, or credential material.

## Non-Goals

Payments, bank reconciliation, inventory valuation, COGS, fiscal closing, exchange revaluation,
financial statements, approval workflows, and PDF reports are intentionally deferred.
