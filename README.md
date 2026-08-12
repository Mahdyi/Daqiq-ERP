# Daqiq ERP - Angular 20 + PostgreSQL/PostgREST Enterprise ERP Prototype

Daqiq ERP is a modular ERP prototype with a Persian RTL user interface, built with Angular 20, PostgreSQL, PostgREST, role-based access control, audit logging, inventory, purchasing, sales, accounting, and payments.

This repository is an MVP Phase 1 and local demo-ready portfolio project. It is not presented as a fully production-hardened ERP.

## Key Features

Authentication and security:

- PostgreSQL-backed login
- JWT access tokens accepted by PostgREST
- refresh tokens with rotation and logout revocation
- role-based authorization
- permission-aware Angular routes and navigation
- PostgreSQL grants and row-level security as the final access-control boundary
- user management
- audit log and activity tracking

Configuration and platform:

- runtime settings
- lookup/reference tables
- feature flags
- typed Angular API client
- generic CRUD foundation
- generic table and dynamic form infrastructure
- backend health check
- backend smoke-test runner
- Playwright browser demo automation

ERP modules:

- customer master data
- product/item master data
- supplier master data
- warehouses and storage locations
- inventory balances and movements
- purchase orders
- goods receipts
- supplier invoices
- sales orders
- sales deliveries/shipments
- sales invoices
- chart of accounts
- journal entries
- general ledger
- cash/bank accounts
- customer receipts
- supplier payments
- invoice settlement tracking
- read-only operational reports

## Tech Stack

Frontend:

- Angular 20
- standalone components
- Angular signals
- OnPush change detection
- strict TypeScript
- PrimeNG/Sakai-inspired UI
- Persian RTL layout
- Playwright browser smoke tests

Backend:

- PostgreSQL
- PostgREST
- Docker Compose for local development
- PostgreSQL constraints, grants, RLS, triggers, views, and RPCs
- PowerShell smoke tests

## Architecture Summary

The main runtime path is:

```text
Angular ERP shell and feature libraries
ApiClient
PostgREST views/RPCs
PostgreSQL schemas, constraints, RLS, and business functions
```

Angular owns presentation, route guards, typed forms, typed tables, local UI state, and feature composition. The shared `ApiClient` is the intended HTTP entry point for frontend data access.

PostgREST exposes the approved API schema. Read models are exposed through tables/views where safe. Business transactions that must be atomic are exposed through RPC functions.

PostgreSQL is the source of truth for data integrity and security. Constraints, grants, RLS policies, triggers, and private helper functions enforce the rules even if a frontend button is hidden or bypassed.

Audit logging records important authentication, administration, security, and business events.

Reporting views summarize inventory, purchasing, sales, settlements, accounting, payments, and audit activity. They are read-only operational reports, not external BI dashboards or financial statements.

More detail: [docs/architecture.md](docs/architecture.md)

## Business Flows

Purchase-to-pay:

```text
Supplier -> Purchase Order -> Goods Receipt -> Supplier Invoice -> Accounting Posting -> Supplier Payment
```

Order-to-cash:

```text
Customer -> Sales Order -> Sales Delivery -> Sales Invoice -> Accounting Posting -> Customer Receipt
```

Inventory:

```text
Goods Receipt -> Inventory Increase
Sales Delivery -> Inventory Decrease
```

Accounting:

```text
Invoice -> Journal Entry -> General Ledger
Payment -> Journal Entry -> Settlement
```

## Running Locally

Start the backend:

```powershell
docker compose --env-file backend/.env -f backend/docker-compose.yml up -d
```

Set local URLs:

```powershell
$env:PGRST_BASE_URL = "http://127.0.0.1:3500"
$env:ERP_APP_BASE_URL = "http://localhost:4200"
```

Run backend health and smoke checks:

```powershell
npm run health:backend
npm run smoke:backend
```

Build and start Angular:

```powershell
npm run build
npm start
```

Run the browser demo smoke:

```powershell
npm run e2e:demo
```

Headed browser rehearsal:

```powershell
npm run e2e:demo:headed
```

## Environment Variables

Use local-only environment variables for smoke tests and browser demo credentials.

Templates:

- [backend/postgrest/.env.smoke.example](backend/postgrest/.env.smoke.example)
- [e2e/.env.e2e.example](e2e/.env.e2e.example)

Never commit local secrets, JWTs, passwords, refresh tokens, database dumps with private data, or local `.env` files.

## Demo Documentation

- [Demo readiness guide](docs/demo-readiness.md)
- [Browser demo automation](docs/browser-demo-automation.md)
- [Presenter script](docs/presenter-script.md)
- [UI demo checklist](docs/ui-demo-checklist.md)
- [Screenshot guide](docs/screenshot-guide.md)
- [Portfolio case study](docs/portfolio-case-study.md)

## Project Status

MVP Phase 1 is completed and local demo-ready.

Verified workflow:

- backend health check passes
- all backend smoke tests pass
- Angular build passes
- Playwright browser demo smoke passes
- reporting foundation build and smoke checks are available

This project is portfolio-grade and suitable for technical demonstration. It still needs a production security review, deployment hardening, CI/CD, and operational controls before real production use.

## Known Limitations

Not implemented yet:

- production deployment pipeline
- CI/CD
- bank reconciliation
- financial statements
- approval workflow
- PDF printing
- email sending
- lot/serial tracking
- advanced BI/report builder
- production identity-provider integration
- production security hardening review

## Recommended Next Step

Step 39: Reporting Filters, Export Preparation, and KPI Cards.

Candidate next reporting improvements:

- date and entity filters across report pages
- lightweight KPI summary cards
- export-safe row shaping
- AR/AP aging preparation
- financial-statement groundwork
