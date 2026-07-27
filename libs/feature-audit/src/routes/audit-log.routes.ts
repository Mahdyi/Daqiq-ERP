import { Routes } from '@angular/router';
import { authGuard, authorizationGuard } from '@daqiq/core';

import { AuditLogRepository } from '../data-access/audit-log-repository.service';
import { AuditLogFacade } from '../facades/audit-log.facade';

export const AUDIT_LOG_ROUTES: Routes = [
  {
    path: '',
    providers: [
      AuditLogRepository,
      AuditLogFacade
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'گزارش فعالیت‌ها',
          authorization: {
            permissions: ['audit.view']
          }
        },
        loadComponent: () =>
          import('../pages/audit-log-list/audit-log-list.page').then(
            (page) => page.AuditLogListPage
          )
      },
      {
        path: ':id',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'جزئیات فعالیت',
          authorization: {
            permissions: ['audit.view']
          }
        },
        loadComponent: () =>
          import('../pages/audit-log-detail/audit-log-detail.page').then(
            (page) => page.AuditLogDetailPage
          )
      }
    ]
  }
];
