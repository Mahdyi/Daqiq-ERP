import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('../pages/login/login.page').then((page) => page.LoginPage)
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  }
];
