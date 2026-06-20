import { Routes } from '@angular/router';
import { authorizationGuard, AuthorizationRouteData } from '@daqiq/core';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authorizationGuard],
    data: {
      breadcrumb: 'داشبورد',
      authorization: {
        permissions: ['dashboard.view']
      }
    } satisfies AuthorizationRouteData,
    loadComponent: () =>
      import('../pages/dashboard/dashboard.page').then((page) => page.DashboardPage)
  }
];
