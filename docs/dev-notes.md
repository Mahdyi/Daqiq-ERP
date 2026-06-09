# Daqiq ERP - Development Notes

## Project Info

**Project name:** Daqiq ERP
**Stack:** Angular 20, Standalone Components, Signals, PrimeNG, Sakai-inspired layout, SCSS, RTL Persian support
**Architecture style:** Enterprise monorepo-ready structure with apps/libs separation

---

# Step 1 - Enterprise Folder Structure

## Goal

Design a scalable Angular ERP architecture before coding.

## Main decision

The project uses this structure:

```text
apps/
  erp-shell/

libs/
  core/
  shared/
  ui/
  data-access/
  feature-auth/
  feature-dashboard/
  feature-customers/
  feature-equipment/
  feature-preinvoices/
  feature-equipment-receipts/
```

## Why this matters

* `apps/erp-shell` contains the main application shell only.
* `libs/core` contains global services like theme, auth, HTTP, loading, notifications, and layout state.
* `libs/shared` contains reusable models, utilities, pipes, validators, and directives.
* `libs/ui` contains reusable presentational UI components.
* `libs/data-access` contains generic API infrastructure only.
* Feature libraries contain domain-specific pages, components, facades, models, DTOs, and data-access code.

## Important architecture rule

Domain-specific logic must stay inside its own feature library.
For example, customer API logic belongs in:

```text
libs/feature-customers/src/data-access/
```

not in global `libs/data-access`.

---

# Step 2 - Workspace Initialization

## Goal

Create the Angular 20 workspace foundation.

## What changed

* Angular 20 workspace initialized.
* `erp-shell` app created under `apps/erp-shell`.
* Base libraries created under `libs/`.
* Path aliases added in `tsconfig.base.json`.
* Empty architecture folders preserved using `.gitkeep`.
* Root scripts configured for the shell app.

## Important files

```text
package.json
angular.json
tsconfig.base.json
apps/erp-shell/src/main.ts
apps/erp-shell/src/app/app.config.ts
apps/erp-shell/src/app/app.routes.ts
```

## Commands used

```powershell
npm run build
```

## Result

Build passed.

## Notes

ChromeHeadless test had a local Windows browser/GPU startup issue, but it was not an Angular or TypeScript build problem.

---

# Step 3 - PrimeNG + Sakai Shell Setup

## Goal

Install PrimeNG and create the first Sakai-inspired ERP shell.

## Packages installed

```text
primeng@20.4.0
@primeng/themes@20.4.0
primeicons@7.0.0
@angular/animations@20.3.24
@angular/cdk@20.2.14
```

## Why these versions

The project uses Angular 20, so PrimeNG 20.x was used.
PrimeNG 21 was avoided because it targets Angular 21.

## What changed

* PrimeNG configured globally using `providePrimeNG()`.
* Aura preset added as the base theme.
* PrimeIcons added globally.
* Initial RTL document setup added.
* Sakai-inspired layout created.
* `/dashboard` placeholder route added with lazy loading.

## Important files

```text
apps/erp-shell/src/app/app.config.ts
apps/erp-shell/src/app/app.routes.ts
apps/erp-shell/src/styles.scss
apps/erp-shell/src/index.html
apps/erp-shell/src/app/layout/shell-layout.component.ts
apps/erp-shell/src/app/layout/topbar.component.ts
apps/erp-shell/src/app/layout/sidebar.component.ts
apps/erp-shell/src/app/layout/breadcrumb.component.ts
apps/erp-shell/src/app/layout/footer.component.ts
apps/erp-shell/src/app/pages/dashboard-placeholder.component.ts
```

## Commands used

```powershell
npm run build
npm start
```

## Browser URL

```text
http://localhost:4200
```

## Result

Build passed.

---

# Useful Commands

## Start development server

```powershell
cd "D:\Projects\Daqiq ERP"
npm start
```

## Build project

```powershell
npm run build
```

## Check Git changes

```powershell
git status
```

## Save checkpoint

```powershell
git add .
git commit -m "step-x description"
```

---

# Things I Need To Study

## Angular

* Standalone components
* `app.config.ts`
* `provideRouter()`
* Lazy-loaded routes
* Signals
* `computed()`
* `effect()`
* `input()` and `output()`
* `ChangeDetectionStrategy.OnPush`

## Architecture

* Difference between `apps/` and `libs/`
* Difference between `core`, `shared`, `ui`, and `data-access`
* Feature-based architecture
* Smart/container components
* Dumb/presentational components
* Facade pattern
* DTO vs domain model
* Repository pattern

## PrimeNG / UI

* `providePrimeNG()`
* Aura theme preset
* PrimeIcons
* Sakai layout structure
* RTL layout behavior

---

## Questions

### Architecture questions

* Why do we separate `apps/` and `libs/`?
* Why should `apps/erp-shell` contain minimal business logic?
* Why is reusable logic placed inside libraries instead of the app?
* What is the difference between `libs/core`, `libs/shared`, `libs/ui`, and `libs/data-access`?
* Why should domain-specific logic stay inside feature libraries?
* Why should global `libs/data-access` stay generic only?
* How does this structure help if the ERP grows to many modules?
* How does this structure help if we later move to Nx?

### Angular questions

* Why do we use standalone components instead of NgModules?
* Why is `provideRouter()` configured globally?
* Why is `provideHttpClient()` configured globally?
* Why is `providePrimeNG()` inside `app.config.ts`?
* Why is `ChangeDetectionStrategy.OnPush` important?
* Why are signals useful for ERP state management?
* When should I use `signal()`?
* When should I use `computed()`?
* When should I use `effect()`?
* What is the difference between `input()` and normal `@Input()`?
* What is the difference between `output()` and normal `@Output()`?

### PrimeNG / Sakai questions

* Why did we use PrimeNG 20 instead of PrimeNG 21?
* Why should we avoid `--force` and `--legacy-peer-deps`?
* Why is Aura used as the first base theme?
* Why are PrimeIcons imported globally?
* What parts of Sakai are useful for this ERP?
* Why should we not copy the entire Sakai template blindly?
* Why is layout inside `apps/erp-shell` instead of `libs/ui` for now?
* Which layout parts might later move into `libs/ui`?
* How does the right sidebar support Persian RTL UX?

### Routing questions

* Why does `/` redirect to `/dashboard`?
* Why is `/dashboard` lazy-loaded?
* What is route-level code splitting?
* Why should ERP features be lazy-loaded?
* Where should future feature routes live?
* How will `feature-customers`, `feature-preinvoices`, and other features connect to the shell?

### File-specific questions

* What does `main.ts` do?
* What does `app.config.ts` do?
* What does `app.routes.ts` do?
* What does `styles.scss` do?
* What does `tsconfig.base.json` do?
* What does `angular.json` do?
* What does `package.json` control?
* What does `shell-layout.component.ts` control?
* What does `sidebar.component.ts` control?
* What does `topbar.component.ts` control?
* What does `breadcrumb.component.ts` control?

### Code quality questions

* Did this step keep business logic out of the app shell?
* Did this step use standalone components only?
* Did this step use `OnPush` everywhere?
* Did this step avoid `any`?
* Did this step keep domain boundaries clean?
* Did this step avoid duplicated components?
* Did this step build successfully?
* Which files should I review before committing?
* What should the Git commit message be?

### Personal learning questions

* What did I understand from this step?
* What still feels confusing?
* Which file should I study first?
* Which Angular concept appeared in this step?
* Which architecture concept appeared in this step?
* What question should I ask Codex before continuing?


# Rules For This Project

## Do

* Keep features isolated.
* Use standalone components only.
* Use strict TypeScript.
* Use signals where possible.
* Use `OnPush` everywhere.
* Keep reusable UI in `libs/ui`.
* Keep global services in `libs/core`.
* Keep generic API infrastructure in `libs/data-access`.
* Keep domain-specific API code inside feature libraries.
* Commit after every successful step.

## Do Not

* Do not use NgModules.
* Do not use `any`.
* Do not use `--force`.
* Do not use `--legacy-peer-deps`.
* Do not put business logic inside the app shell.
* Do not put all APIs inside global `libs/data-access`.
* Do not commit secrets, passwords, `.env` files, real customer files, or production credentials.

---

# Questions To Ask Codex After Each Step

1. Which files did you change?
2. Why did you change each file?
3. Which files should I study first?
4. Did you keep business logic out of the app shell?
5. Did you use standalone components only?
6. Did you use `OnPush`?
7. Did the build pass?
8. What should be committed now?

---

# Current Status

## Completed

* Step 1: Enterprise folder structure
* Step 2: Workspace initialization
* Step 3: PrimeNG + Sakai shell setup

## Next Step

Step 4: Enterprise theming system

## Before continuing

Run:

```powershell
npm run build
npm start
```

Then check:

```text
http://localhost:4200
```
