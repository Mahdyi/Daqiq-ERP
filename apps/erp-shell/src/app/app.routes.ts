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
        loadComponent: () =>
          import('./pages/dashboard-placeholder.component').then(
            (component) => component.DashboardPlaceholderComponent
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
