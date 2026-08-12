# Portfolio Case Study: Daqiq ERP

## 1. Problem

ERP and MES-style systems need reliable coordination between operations and finance. A serious system must track master data, inventory, purchasing, sales, accounting, payments, user access, and audit activity without relying only on frontend checks.

Many prototypes show screens. This project focuses on the deeper product question: can the business workflow be enforced, verified, and demonstrated end to end?

## 2. Goal

The goal was to build a modular ERP MVP that demonstrates enterprise architecture across:

- inventory
- purchasing
- receiving
- sales
- delivery
- invoicing
- accounting
- payments
- audit logging
- role-based administration

The result is a local demo-ready, portfolio-grade ERP prototype.

## 3. My Role

I designed and implemented the application architecture, backend security model, business transaction flow, Angular feature structure, PostgreSQL/PostgREST API surface, smoke-test strategy, and browser demo workflow.

The work included frontend engineering, database design, security boundaries, technical writing, demo preparation, and product operations.

## 4. Architecture Decisions

Angular feature libraries:

- each business area is isolated as a lazy feature library
- route metadata drives breadcrumbs and permissions
- shared UI components avoid duplicated tables/forms/feedback
- strict TypeScript and signals keep frontend state predictable

PostgREST instead of a custom REST backend:

- PostgreSQL views and RPCs become the API
- the database can remain the source of truth
- business transactions run close to the data

PostgreSQL as business-rule authority:

- constraints protect data shape
- grants and RLS enforce role boundaries
- triggers keep audit and timestamp behavior consistent
- RPCs own posting transactions

Smoke-test-first backend verification:

- each module has role-aware smoke tests
- accounting and payment flows prepare deterministic fixtures
- tests verify success paths, blocked paths, audit events, and ledger balance

Persian RTL enterprise UI:

- the UI is designed for an ERP audience
- navigation, pages, forms, and tables use Persian labels
- PrimeNG/Sakai styling is contained in the UI layer

## 5. Key Implementation Achievements

- PostgreSQL-backed JWT login
- refresh token rotation and logout revocation
- RBAC and permission-aware Angular navigation
- user management
- audit logging
- typed Angular HTTP foundation
- reusable CRUD facade foundation
- dynamic form engine
- generic table infrastructure
- customer, product, supplier, warehouse master data
- inventory movement ledger and balances
- purchase orders and goods receipts
- sales orders and sales deliveries
- supplier and sales invoices
- chart of accounts, journals, and general ledger
- customer receipts and supplier payments
- settlement tracking
- read-only reporting foundation
- backend smoke-test runner
- Playwright browser demo smoke
- presenter and demo documentation

## 6. Engineering Lessons

Business logic belongs in the database for this PostgREST architecture. Frontend validation improves UX, but it cannot be the final rule boundary.

Frontend permissions are not enough security. PostgreSQL roles, grants, and RLS must enforce access even if a route or button is bypassed.

Smoke tests must be deterministic. The most valuable smoke tests prepare or find eligible fixtures instead of relying on uncertain existing data.

Demo readiness is engineering work. Health checks, predictable ports, local env templates, and browser smoke tests reduce presentation risk.

Environment tooling is product quality. If a developer or presenter cannot start, verify, and explain the system, the product is not truly ready to show.

## 7. Current Status

MVP Phase 1 is completed and local demo-ready.

Verified:

- backend health check
- all backend smoke tests
- Angular build
- Playwright browser demo smoke

## 8. Next Roadmap

Recommended next step: Reporting Filters, Export Preparation, and KPI Cards.

Potential next reporting improvements:

- date and entity filters
- KPI summary cards
- export-safe DTO shaping
- AR/AP aging preparation
- financial-statement groundwork

Later product areas:

- financial statements
- PDF printing
- approval workflows
- bank reconciliation
- CI/CD and deployment
- production identity-provider integration
