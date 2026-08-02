import { Routes } from '@angular/router';
import { authGuard, authorizationGuard } from '@daqiq/core';

import { SupplierRepository } from '../data-access/supplier-repository.service';
import { SupplierFacade } from '../facades/supplier.facade';

export const SUPPLIER_ROUTES: Routes = [
  {
    path: '',
    providers: [SupplierRepository, SupplierFacade],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'تأمین‌کنندگان',
          authorization: {
            permissions: ['suppliers.view']
          }
        },
        loadComponent: () =>
          import('../pages/supplier-list/supplier-list.page').then((page) => page.SupplierListPage)
      },
      {
        path: 'new',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ایجاد تأمین‌کننده',
          authorization: {
            permissions: ['suppliers.create']
          }
        },
        loadComponent: () =>
          import('../pages/supplier-editor/supplier-editor.page').then(
            (page) => page.SupplierEditorPage
          )
      },
      {
        path: ':id/edit',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ویرایش تأمین‌کننده',
          authorization: {
            permissions: ['suppliers.update']
          }
        },
        loadComponent: () =>
          import('../pages/supplier-editor/supplier-editor.page').then(
            (page) => page.SupplierEditorPage
          )
      }
    ]
  }
];
