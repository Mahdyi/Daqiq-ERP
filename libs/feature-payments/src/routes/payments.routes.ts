import { Routes } from '@angular/router';
import { authGuard, authorizationGuard } from '@daqiq/core';

import { CashBankAccountRepository } from '../data-access/cash-bank-account-repository.service';
import { CustomerReceiptCommandService } from '../data-access/customer-receipt-command.service';
import { CustomerReceiptRepository } from '../data-access/customer-receipt-repository.service';
import { SettlementRepository } from '../data-access/settlement-repository.service';
import { SupplierPaymentCommandService } from '../data-access/supplier-payment-command.service';
import { SupplierPaymentRepository } from '../data-access/supplier-payment-repository.service';
import { CashBankAccountFacade } from '../facades/cash-bank-account.facade';
import { CustomerReceiptEditorFacade } from '../facades/customer-receipt-editor.facade';
import { CustomerReceiptFacade } from '../facades/customer-receipt.facade';
import { SettlementFacade } from '../facades/settlement.facade';
import { SupplierPaymentEditorFacade } from '../facades/supplier-payment-editor.facade';
import { SupplierPaymentFacade } from '../facades/supplier-payment.facade';

const PAYMENT_PROVIDERS = [
  CashBankAccountRepository,
  CustomerReceiptRepository,
  CustomerReceiptCommandService,
  SupplierPaymentRepository,
  SupplierPaymentCommandService,
  SettlementRepository,
  CashBankAccountFacade,
  CustomerReceiptFacade,
  CustomerReceiptEditorFacade,
  SupplierPaymentFacade,
  SupplierPaymentEditorFacade,
  SettlementFacade
];

export const PAYMENTS_ROUTES: Routes = [
  {
    path: '',
    providers: PAYMENT_PROVIDERS,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'customer-receipts'
      },
      {
        path: 'cash-bank-accounts',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'حساب‌های نقد و بانک',
          authorization: {
            permissions: ['cashBankAccounts.view']
          }
        },
        loadComponent: () =>
          import('../pages/cash-bank-accounts/cash-bank-accounts.page').then(
            (page) => page.CashBankAccountsPage
          )
      },
      {
        path: 'customer-receipts',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'دریافت‌های مشتریان',
          authorization: {
            permissions: ['payments.view']
          }
        },
        loadComponent: () =>
          import('../pages/customer-receipt-list/customer-receipt-list.page').then(
            (page) => page.CustomerReceiptListPage
          )
      },
      {
        path: 'customer-receipts/new',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ثبت دریافت مشتری',
          authorization: {
            permissions: ['payments.create']
          }
        },
        loadComponent: () =>
          import('../pages/customer-receipt-editor/customer-receipt-editor.page').then(
            (page) => page.CustomerReceiptEditorPage
          )
      },
      {
        path: 'customer-receipts/:id',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'جزئیات دریافت مشتری',
          authorization: {
            permissions: ['payments.view']
          }
        },
        loadComponent: () =>
          import('../pages/customer-receipt-detail/customer-receipt-detail.page').then(
            (page) => page.CustomerReceiptDetailPage
          )
      },
      {
        path: 'supplier-payments',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'پرداخت‌های تأمین‌کنندگان',
          authorization: {
            permissions: ['payments.view']
          }
        },
        loadComponent: () =>
          import('../pages/supplier-payment-list/supplier-payment-list.page').then(
            (page) => page.SupplierPaymentListPage
          )
      },
      {
        path: 'supplier-payments/new',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ثبت پرداخت تأمین‌کننده',
          authorization: {
            permissions: ['payments.create']
          }
        },
        loadComponent: () =>
          import('../pages/supplier-payment-editor/supplier-payment-editor.page').then(
            (page) => page.SupplierPaymentEditorPage
          )
      },
      {
        path: 'supplier-payments/:id',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'جزئیات پرداخت تأمین‌کننده',
          authorization: {
            permissions: ['payments.view']
          }
        },
        loadComponent: () =>
          import('../pages/supplier-payment-detail/supplier-payment-detail.page').then(
            (page) => page.SupplierPaymentDetailPage
          )
      },
      {
        path: 'settlements',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'وضعیت تسویه فاکتورها',
          authorization: {
            permissions: ['payments.view']
          }
        },
        loadComponent: () =>
          import('../pages/settlement-overview/settlement-overview.page').then(
            (page) => page.SettlementOverviewPage
          )
      }
    ]
  }
];
