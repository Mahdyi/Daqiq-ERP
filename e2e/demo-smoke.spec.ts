import { expect, Page, test } from '@playwright/test';

interface DemoCredentials {
  readonly email: string;
  readonly password: string;
}

interface DemoRoute {
  readonly path: string;
  readonly title: string;
}

const adminRoutes: readonly DemoRoute[] = [
  { path: '/dashboard', title: 'داشبورد مدیریتی' },
  { path: '/master-data/customers', title: 'مشتریان' },
  { path: '/master-data/products', title: 'کالاها' },
  { path: '/master-data/suppliers', title: 'تأمین‌کنندگان' },
  { path: '/master-data/warehouses', title: 'انبارها' },
  { path: '/inventory/balances', title: 'موجودی انبار' },
  { path: '/inventory/movements', title: 'حرکات موجودی' },
  { path: '/purchasing/purchase-orders', title: 'سفارش‌های خرید' },
  { path: '/purchasing/goods-receipts', title: 'رسیدهای خرید' },
  { path: '/purchasing/supplier-invoices', title: 'فاکتورهای تأمین‌کننده' },
  { path: '/sales/sales-orders', title: 'سفارش‌های فروش' },
  { path: '/sales/sales-deliveries', title: 'حواله‌های فروش' },
  { path: '/sales/sales-invoices', title: 'فاکتورهای فروش' },
  { path: '/accounting/chart-of-accounts', title: 'سرفصل‌های حسابداری' },
  { path: '/accounting/journal-entries', title: 'اسناد حسابداری' },
  { path: '/accounting/general-ledger', title: 'دفتر کل' },
  { path: '/payments/cash-bank-accounts', title: 'حساب‌های نقد و بانک' },
  { path: '/payments/customer-receipts', title: 'دریافت‌های مشتریان' },
  { path: '/payments/supplier-payments', title: 'پرداخت‌های تأمین‌کنندگان' },
  { path: '/payments/settlements', title: 'وضعیت تسویه فاکتورها' },
  { path: '/admin/audit-logs', title: 'گزارش فعالیت‌ها' },
  { path: '/admin/users', title: 'کاربران' },
  { path: '/admin/settings', title: 'تنظیمات سامانه' },
  { path: '/admin/lookups', title: 'داده‌های پایه' },
  { path: '/admin/feature-flags', title: 'قابلیت‌های سامانه' }
];

function requiredCredential(role: 'ADMIN' | 'VIEWER'): DemoCredentials {
  const email = process.env[`SMOKE_${role}_EMAIL`];
  const password = process.env[`SMOKE_${role}_PASSWORD`];

  if (!email || !password) {
    throw new Error(
      `Missing browser demo credentials. Set SMOKE_${role}_EMAIL and SMOKE_${role}_PASSWORD locally, or use e2e/.env.e2e.ps1.`
    );
  }

  return { email, password };
}

async function login(page: Page, credentials: DemoCredentials): Promise<void> {
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: 'ورود به سامانه' })).toBeVisible();
  await page.getByTestId('login-email').fill(credentials.email);
  await page.getByTestId('login-password').fill(credentials.password);
  await page.getByTestId('login-submit').locator('button').click();
  await expect(page.getByTestId('app-shell')).toBeVisible();
}

async function logout(page: Page): Promise<void> {
  await page.getByTestId('shell-logout').click();
  await expect(page).toHaveURL(/\/auth\/login/);
}

async function expectPageTitle(page: Page, route: DemoRoute): Promise<void> {
  await page.goto(route.path);
  await expect(page.getByTestId('app-shell')).toBeVisible();
  await expect(page.getByRole('heading', { name: route.title })).toBeVisible();
}

test.describe('Daqiq ERP browser demo smoke', () => {
  test('admin can log in, open major demo routes, and log out', async ({ page }) => {
    await login(page, requiredCredential('ADMIN'));

    for (const route of adminRoutes) {
      await expectPageTitle(page, route);
    }

    await logout(page);
  });

  test('viewer is blocked from admin-only user management', async ({ page }) => {
    await login(page, requiredCredential('VIEWER'));

    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/access-denied/);

    await logout(page);
  });
});
