import { Routes } from '@angular/router';
import { authGuard, authorizationGuard } from '@daqiq/core';

import { UserRepository } from '../data-access/user-repository.service';
import { UserFacade } from '../facades/user.facade';

export const USER_ROUTES: Routes = [
  {
    path: '',
    providers: [
      UserRepository,
      UserFacade
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'کاربران',
          authorization: {
            permissions: ['users.view']
          }
        },
        loadComponent: () =>
          import('../pages/user-list/user-list.page').then((page) => page.UserListPage)
      },
      {
        path: 'new',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ایجاد کاربر',
          authorization: {
            permissions: ['users.create']
          }
        },
        loadComponent: () =>
          import('../pages/user-editor/user-editor.page').then((page) => page.UserEditorPage)
      },
      {
        path: ':id/edit',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ویرایش کاربر',
          authorization: {
            permissions: ['users.update']
          }
        },
        loadComponent: () =>
          import('../pages/user-editor/user-editor.page').then((page) => page.UserEditorPage)
      },
      {
        path: ':id/reset-password',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'تغییر رمز عبور',
          authorization: {
            permissions: ['users.update']
          }
        },
        loadComponent: () =>
          import('../pages/reset-password/reset-password.page').then(
            (page) => page.ResetPasswordPage
          )
      }
    ]
  }
];
