import { Routes } from '@angular/router';
import { authGuard, authorizationGuard } from '@daqiq/core';

import { CustomerRepository } from '../data-access/customer-repository.service';
import { CustomerFacade } from '../facades/customer.facade';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    providers: [
      CustomerRepository,
      CustomerFacade
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'مشتریان',
          authorization: {
            permissions: ['customers.view']
          }
        },
        loadComponent: () =>
          import('../pages/customer-list/customer-list.page').then(
            (page) => page.CustomerListPage
          )
      },
      {
        path: 'new',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ایجاد مشتری',
          authorization: {
            permissions: ['customers.create']
          }
        },
        loadComponent: () =>
          import('../pages/customer-editor/customer-editor.page').then(
            (page) => page.CustomerEditorPage
          )
      },
      {
        path: ':id/edit',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ویرایش مشتری',
          authorization: {
            permissions: ['customers.update']
          }
        },
        loadComponent: () =>
          import('../pages/customer-editor/customer-editor.page').then(
            (page) => page.CustomerEditorPage
          )
      }
    ]
  }
];
