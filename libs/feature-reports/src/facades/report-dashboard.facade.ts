import { Injectable, computed, inject } from '@angular/core';
import { AppPermission, AuthorizationService } from '@daqiq/core';

export interface ReportCategoryLink {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly route: readonly string[];
  readonly permission: AppPermission;
}

const REPORT_CATEGORIES = [
  {
    title: 'انبار',
    description: 'موجودی کالاها و خلاصه گردش موجودی',
    icon: 'pi pi-box',
    route: ['/reports/inventory'],
    permission: 'reports.inventory.view'
  },
  {
    title: 'خرید',
    description: 'وضعیت سفارش‌ها، رسیدها و تسویه تامین‌کنندگان',
    icon: 'pi pi-shopping-cart',
    route: ['/reports/purchasing'],
    permission: 'reports.purchasing.view'
  },
  {
    title: 'فروش',
    description: 'وضعیت سفارش‌ها، حواله‌ها و تسویه مشتریان',
    icon: 'pi pi-shopping-bag',
    route: ['/reports/sales'],
    permission: 'reports.sales.view'
  },
  {
    title: 'حسابداری',
    description: 'خلاصه دفتر کل و فعالیت اسناد حسابداری',
    icon: 'pi pi-calculator',
    route: ['/reports/accounting'],
    permission: 'reports.accounting.view'
  },
  {
    title: 'دریافت و پرداخت',
    description: 'خلاصه دریافت‌های مشتری و پرداخت‌های تامین‌کننده',
    icon: 'pi pi-wallet',
    route: ['/reports/payments'],
    permission: 'reports.payments.view'
  },
  {
    title: 'فعالیت‌ها',
    description: 'خلاصه رویدادهای امنیتی و عملیاتی سامانه',
    icon: 'pi pi-history',
    route: ['/reports/audit'],
    permission: 'reports.audit.view'
  }
] as const satisfies readonly ReportCategoryLink[];

@Injectable()
export class ReportDashboardFacade {
  private readonly authorization = inject(AuthorizationService);

  readonly visibleCategories = computed(() =>
    REPORT_CATEGORIES.filter((category) => this.authorization.hasPermission(category.permission))
  );
}
