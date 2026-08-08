import { Routes } from '@angular/router';
import { authGuard, authorizationGuard } from '@daqiq/core';

import { AccountingPostingCommandService } from '../data-access/accounting-posting-command.service';
import { AccountingPeriodRepository } from '../data-access/accounting-period-repository.service';
import { GlAccountRepository } from '../data-access/gl-account-repository.service';
import { JournalEntryCommandService } from '../data-access/journal-entry-command.service';
import { JournalEntryRepository } from '../data-access/journal-entry-repository.service';
import { AccountingPeriodFacade } from '../facades/accounting-period.facade';
import { GeneralLedgerFacade } from '../facades/general-ledger.facade';
import { GlAccountFacade } from '../facades/gl-account.facade';
import { JournalEntryEditorFacade } from '../facades/journal-entry-editor.facade';
import { JournalEntryFacade } from '../facades/journal-entry.facade';

const ACCOUNTING_PROVIDERS = [
  GlAccountRepository,
  AccountingPeriodRepository,
  JournalEntryRepository,
  JournalEntryCommandService,
  AccountingPostingCommandService,
  GlAccountFacade,
  AccountingPeriodFacade,
  JournalEntryFacade,
  JournalEntryEditorFacade,
  GeneralLedgerFacade
];

export const ACCOUNTING_ROUTES: Routes = [
  {
    path: '',
    providers: ACCOUNTING_PROVIDERS,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'journal-entries'
      },
      {
        path: 'chart-of-accounts',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'سرفصل‌های حسابداری',
          authorization: {
            permissions: ['chartOfAccounts.view']
          }
        },
        loadComponent: () =>
          import('../pages/chart-of-accounts/chart-of-accounts.page').then(
            (page) => page.ChartOfAccountsPage
          )
      },
      {
        path: 'periods',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'دوره‌های مالی',
          authorization: {
            permissions: ['accountingPeriods.view']
          }
        },
        loadComponent: () =>
          import('../pages/accounting-periods/accounting-periods.page').then(
            (page) => page.AccountingPeriodsPage
          )
      },
      {
        path: 'journal-entries',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'اسناد حسابداری',
          authorization: {
            permissions: ['accounting.view']
          }
        },
        loadComponent: () =>
          import('../pages/journal-entry-list/journal-entry-list.page').then(
            (page) => page.JournalEntryListPage
          )
      },
      {
        path: 'journal-entries/new',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ایجاد سند حسابداری',
          authorization: {
            permissions: ['accounting.create']
          }
        },
        loadComponent: () =>
          import('../pages/journal-entry-editor/journal-entry-editor.page').then(
            (page) => page.JournalEntryEditorPage
          )
      },
      {
        path: 'journal-entries/:id',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'جزئیات سند حسابداری',
          authorization: {
            permissions: ['accounting.view']
          }
        },
        loadComponent: () =>
          import('../pages/journal-entry-detail/journal-entry-detail.page').then(
            (page) => page.JournalEntryDetailPage
          )
      },
      {
        path: 'general-ledger',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'دفتر کل',
          authorization: {
            permissions: ['accounting.view']
          }
        },
        loadComponent: () =>
          import('../pages/general-ledger/general-ledger.page').then(
            (page) => page.GeneralLedgerPage
          )
      }
    ]
  }
];
