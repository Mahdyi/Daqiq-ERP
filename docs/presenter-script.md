# Daqiq ERP Presenter Script

This is a practical 5-10 minute script for a product demo.

## 1. Opening

Today I am showing Daqiq ERP, a browser-based enterprise resource planning foundation for master data, inventory, purchasing, sales, accounting, payments, audit logging, and administration.

The point of this demo is not just screens. The important part is that the UI is backed by PostgreSQL and PostgREST, with database constraints, grants, row-level security, and audit logging enforcing the real business rules.

## 2. Problem The ERP Solves

Most growing businesses quickly outgrow spreadsheets and disconnected tools. They need one reliable place to answer:

```text
Who are our customers and suppliers?
What do we buy and sell?
What is in stock?
Which orders have been received or delivered?
Which invoices are unpaid?
What accounting entries were generated?
Who performed each operation?
```

Daqiq ERP is being built as a secure, modular foundation for those workflows.

## 3. Architecture Summary

The production data path is:

```text
Angular ERP
PostgREST
PostgreSQL
```

Angular handles the user experience, typed forms, typed tables, guards, navigation, notifications, and route permissions.

PostgREST exposes controlled REST and RPC endpoints.

PostgreSQL is the final security and correctness boundary through constraints, RLS, grants, helper functions, and audit logs.

Backend smoke tests verify business behavior. Browser demo smoke verifies UI readiness.

## 4. Login And Dashboard

Log in as an admin user.

Show:

```text
real login
JWT-backed session
authenticated shell
dashboard
logout button
```

Explain that mock login has been replaced by PostgreSQL-backed authentication with access and refresh-token lifecycle support.

## 5. Master Data

Open:

```text
Customers
Products
Suppliers
Warehouses
Storage locations
```

Explain that these are the reference records used by purchasing, sales, warehouse, and accounting flows.

Point out that lookup values and feature flags are centrally managed, so modules do not hard-code currencies, units, groups, or availability switches.

## 6. Purchase-To-Pay Flow

Open:

```text
Purchase orders
Goods receipts
Supplier invoices
```

Explain the lifecycle:

```text
Purchase order
Goods receipt
Inventory increase
Supplier invoice
Accounting posting
Supplier payment
```

Emphasize that inventory is changed by receipt posting, not by creating a purchase order.

## 7. Order-To-Cash Flow

Open:

```text
Sales orders
Sales deliveries
Sales invoices
```

Explain the lifecycle:

```text
Sales order
Sales delivery
Inventory decrease
Sales invoice
Accounting posting
Customer receipt
```

Emphasize that inventory is decreased by delivery/shipment, not by creating or confirming a sales order.

## 8. Accounting And General Ledger

Open:

```text
Chart of accounts
Journal entries
General ledger
```

Explain that accounting postings are balanced and generated through backend-controlled functions. Manual journal entries are supported, but posting validations are still enforced by the database.

## 9. Payments And Settlements

Open:

```text
Cash/bank accounts
Customer receipts
Supplier payments
Settlement overview
```

Explain that receipts and payments post accounting effects and reduce invoice remaining balances. The smoke tests verify over-allocation is blocked.

## 10. Audit And Security

Open:

```text
Audit logs
Users
Settings
Lookups
Feature flags
```

Explain:

```text
PostgreSQL/RLS is the real security boundary.
Angular permissions protect UI and routes.
PostgREST exposes controlled APIs and RPCs.
Audit logs record important authentication, business, and administration events.
```

Switch to a restricted role if useful and show that unauthorized admin pages are blocked.

## 11. Intentionally Not Implemented Yet

Be explicit about the current scope:

```text
no bank reconciliation
no payment gateway
no financial statements yet
no approval workflow
no lot/serial tracking
no PDF printing
no email sending
no production identity provider
no deployment pipeline
```

These are future modules, not accidental gaps.

## 12. Closing

Daqiq ERP now has a working MVP business engine plus operational readiness:

```text
backend health check
full backend smoke tests
browser demo smoke
presenter checklist
repeatable local environment handling
```

The next product step can safely build on this foundation instead of relying on manual troubleshooting.
