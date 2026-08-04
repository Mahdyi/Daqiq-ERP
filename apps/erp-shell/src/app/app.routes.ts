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
        path: 'master-data/customers',
        loadChildren: () =>
          import('@daqiq/feature-customers').then((customers) => customers.CUSTOMER_ROUTES)
      },
      {
        path: 'master-data/products',
        loadChildren: () =>
          import('@daqiq/feature-products').then((products) => products.PRODUCT_ROUTES)
      },
      {
        path: 'master-data/suppliers',
        loadChildren: () =>
          import('@daqiq/feature-suppliers').then((suppliers) => suppliers.SUPPLIER_ROUTES)
      },
      {
        path: 'master-data',
        loadChildren: () =>
          import('@daqiq/feature-warehouses').then((warehouses) => warehouses.WAREHOUSE_ROUTES)
      },
      {
        path: 'inventory',
        loadChildren: () =>
          import('@daqiq/feature-inventory').then((inventory) => inventory.INVENTORY_ROUTES)
      },
      {
        path: 'admin/users',
        loadChildren: () => import('@daqiq/feature-users').then((users) => users.USER_ROUTES)
      },
      {
        path: 'admin/audit-logs',
        loadChildren: () =>
          import('@daqiq/feature-audit').then((audit) => audit.AUDIT_LOG_ROUTES)
      },
      {
        path: 'admin',
        loadChildren: () =>
          import('@daqiq/feature-settings').then((settings) => settings.SETTINGS_ROUTES)
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
