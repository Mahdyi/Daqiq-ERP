import { Routes } from '@angular/router';
import { authGuard, authorizationGuard } from '@daqiq/core';

import { ProductRepository } from '../data-access/product-repository.service';
import { ProductFacade } from '../facades/product.facade';

export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    providers: [ProductRepository, ProductFacade],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'کالاها',
          authorization: {
            permissions: ['products.view']
          }
        },
        loadComponent: () =>
          import('../pages/product-list/product-list.page').then((page) => page.ProductListPage)
      },
      {
        path: 'new',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ایجاد کالا',
          authorization: {
            permissions: ['products.create']
          }
        },
        loadComponent: () =>
          import('../pages/product-editor/product-editor.page').then(
            (page) => page.ProductEditorPage
          )
      },
      {
        path: ':id/edit',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ویرایش کالا',
          authorization: {
            permissions: ['products.update']
          }
        },
        loadComponent: () =>
          import('../pages/product-editor/product-editor.page').then(
            (page) => page.ProductEditorPage
          )
      }
    ]
  }
];
