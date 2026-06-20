import { Routes } from '@angular/router';
import { authGuard } from '@daqiq/core';

import { ShellLayoutComponent } from './layout/shell-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('@daqiq/feature-auth').then((auth) => auth.AUTH_ROUTES)
  },
  {
    path: '',
    component: ShellLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('@daqiq/feature-dashboard').then((dashboard) => dashboard.DASHBOARD_ROUTES)
      },
      {
        path: 'access-denied',
        data: {
          breadcrumb: 'دسترسی مجاز نیست'
        },
        loadComponent: () =>
          import('./pages/access-denied/access-denied.page').then(
            (page) => page.AccessDeniedPage
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
