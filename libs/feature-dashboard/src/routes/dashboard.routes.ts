import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    data: {
      breadcrumb: 'داشبورد'
    },
    loadComponent: () =>
      import('../pages/dashboard/dashboard.page').then((page) => page.DashboardPage)
  }
];
