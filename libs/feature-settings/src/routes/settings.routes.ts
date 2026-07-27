import { Routes } from '@angular/router';
import { authorizationGuard } from '@daqiq/core';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'settings'
  },
  {
    path: 'settings',
    canActivate: [authorizationGuard],
    data: {
      breadcrumb: 'تنظیمات سامانه',
      authorization: {
        permissions: ['settings.view']
      }
    },
    loadComponent: () =>
      import('../pages/settings-list/settings-list.page').then((page) => page.SettingsListPage)
  },
  {
    path: 'lookups',
    canActivate: [authorizationGuard],
    data: {
      breadcrumb: 'داده‌های پایه',
      authorization: {
        permissions: ['lookups.view']
      }
    },
    loadComponent: () =>
      import('../pages/lookup-management/lookup-management.page').then(
        (page) => page.LookupManagementPage
      )
  },
  {
    path: 'feature-flags',
    canActivate: [authorizationGuard],
    data: {
      breadcrumb: 'قابلیت‌های سامانه',
      authorization: {
        permissions: ['featureFlags.view']
      }
    },
    loadComponent: () =>
      import('../pages/feature-flags/feature-flags.page').then((page) => page.FeatureFlagsPage)
  }
];
