# Screenshot And Demo Evidence Guide

This guide describes how to capture portfolio/demo evidence for Daqiq ERP.

Do not create fake screenshots. Use the real local app with seeded fictional data.

## Recommended Screenshots

Capture these screens after backend health, backend smoke tests, Angular build, and browser smoke have passed:

1. Login page
2. Dashboard
3. Customers
4. Products
5. Suppliers
6. Warehouses
7. Inventory balances
8. Inventory movements
9. Purchase orders
10. Goods receipts
11. Supplier invoices
12. Sales orders
13. Sales deliveries
14. Sales invoices
15. Chart of accounts
16. Journal entries
17. General ledger
18. Cash/bank accounts
19. Customer receipts
20. Supplier payments
21. Settlement overview
22. Audit log
23. User management
24. Settings
25. Lookups
26. Feature flags

## Manual Capture Process

1. Start backend.
2. Run:

```powershell
npm run health:backend
npm run smoke:backend
npm run build
npm run e2e:demo
```

3. Start Angular:

```powershell
npm start
```

4. Open:

```text
http://localhost:4200
```

5. Log in using local demo credentials.
6. Capture screenshots using the operating-system screenshot tool or browser tools.
7. Save sanitized screenshots under:

```text
docs/screenshots/
```

## Naming Convention

Use numbered, stable filenames:

```text
01-login.png
02-dashboard.png
03-customers.png
04-products.png
05-inventory-balances.png
```

## Sanitization Rules

Before committing screenshots, confirm they do not show:

- passwords
- JWTs
- refresh tokens
- Authorization headers
- local `.env` files
- real personal data
- real financial data
- private customer/supplier details

## Playwright Evidence

Playwright stores failure evidence in:

```text
test-results/
playwright-report/
```

These folders are ignored by Git. They are useful for debugging but should not be committed unless a specific sanitized artifact is intentionally copied into `docs/screenshots/`.

## Optional Future Automation

A later step can add a dedicated screenshot-capture Playwright script. It should be separate from the demo smoke test so presentation verification stays stable and fast.
