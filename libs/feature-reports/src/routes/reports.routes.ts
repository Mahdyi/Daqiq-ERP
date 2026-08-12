import { Routes } from '@angular/router';
import { authGuard, authorizationGuard } from '@daqiq/core';

import { ReportRepository } from '../data-access/report-repository.service';
import { AccountingReportsFacade } from '../facades/accounting-reports.facade';
import { AuditReportsFacade } from '../facades/audit-reports.facade';
import { InventoryReportsFacade } from '../facades/inventory-reports.facade';
import { PaymentReportsFacade } from '../facades/payment-reports.facade';
import { PurchasingReportsFacade } from '../facades/purchasing-reports.facade';
import { ReportDashboardFacade } from '../facades/report-dashboard.facade';
import { SalesReportsFacade } from '../facades/sales-reports.facade';

const REPORT_PROVIDERS = [
  ReportRepository,
  ReportDashboardFacade,
  InventoryReportsFacade,
  PurchasingReportsFacade,
  SalesReportsFacade,
  AccountingReportsFacade,
  PaymentReportsFacade,
  AuditReportsFacade
];

export const REPORT_ROUTES: Routes = [
  {
    path: '',
    providers: REPORT_PROVIDERS,
    children: [
      {
        path: '',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'گزارش‌ها',
          authorization: {
            permissions: ['reports.view']
          }
        },
        loadComponent: () =>
          import('../pages/reports-overview/reports-overview.page').then(
            (page) => page.ReportsOverviewPage
          )
      },
      {
        path: 'inventory',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'گزارش‌های انبار',
          authorization: {
            permissions: ['reports.inventory.view']
          }
        },
        loadComponent: () =>
          import('../pages/inventory-reports/inventory-reports.page').then(
            (page) => page.InventoryReportsPage
          )
      },
      {
        path: 'purchasing',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'گزارش‌های خرید',
          authorization: {
            permissions: ['reports.purchasing.view']
          }
        },
        loadComponent: () =>
          import('../pages/purchasing-reports/purchasing-reports.page').then(
            (page) => page.PurchasingReportsPage
          )
      },
      {
        path: 'sales',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'گزارش‌های فروش',
          authorization: {
            permissions: ['reports.sales.view']
          }
        },
        loadComponent: () =>
          import('../pages/sales-reports/sales-reports.page').then((page) => page.SalesReportsPage)
      },
      {
        path: 'accounting',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'گزارش‌های حسابداری',
          authorization: {
            permissions: ['reports.accounting.view']
          }
        },
        loadComponent: () =>
          import('../pages/accounting-reports/accounting-reports.page').then(
            (page) => page.AccountingReportsPage
          )
      },
      {
        path: 'payments',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'گزارش‌های دریافت و پرداخت',
          authorization: {
            permissions: ['reports.payments.view']
          }
        },
        loadComponent: () =>
          import('../pages/payment-reports/payment-reports.page').then(
            (page) => page.PaymentReportsPage
          )
      },
      {
        path: 'audit',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'گزارش فعالیت‌ها',
          authorization: {
            permissions: ['reports.audit.view']
          }
        },
        loadComponent: () =>
          import('../pages/audit-reports/audit-reports.page').then((page) => page.AuditReportsPage)
      }
    ]
  }
];
