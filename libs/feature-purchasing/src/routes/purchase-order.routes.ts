import { Routes } from '@angular/router';
import { authGuard, authorizationGuard } from '@daqiq/core';

import { PurchaseOrderCommandService } from '../data-access/purchase-order-command.service';
import { PurchaseOrderReferenceDataService } from '../data-access/purchase-order-reference-data.service';
import { PurchaseOrderRepository } from '../data-access/purchase-order-repository.service';
import { PurchaseOrderEditorFacade } from '../facades/purchase-order-editor.facade';
import { PurchaseOrderFacade } from '../facades/purchase-order.facade';

export const PURCHASE_ORDER_ROUTES: Routes = [
  {
    path: '',
    providers: [
      PurchaseOrderRepository,
      PurchaseOrderCommandService,
      PurchaseOrderReferenceDataService,
      PurchaseOrderFacade,
      PurchaseOrderEditorFacade
    ],
    children: [
      {
        path: '',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'سفارش‌های خرید',
          authorization: {
            permissions: ['purchasing.view']
          }
        },
        loadComponent: () =>
          import('../pages/purchase-order-list/purchase-order-list.page').then(
            (page) => page.PurchaseOrderListPage
          )
      },
      {
        path: 'new',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ایجاد سفارش خرید',
          authorization: {
            permissions: ['purchasing.create']
          }
        },
        loadComponent: () =>
          import('../pages/purchase-order-editor/purchase-order-editor.page').then(
            (page) => page.PurchaseOrderEditorPage
          )
      },
      {
        path: ':id',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'جزئیات سفارش خرید',
          authorization: {
            permissions: ['purchasing.view']
          }
        },
        loadComponent: () =>
          import('../pages/purchase-order-detail/purchase-order-detail.page').then(
            (page) => page.PurchaseOrderDetailPage
          )
      },
      {
        path: ':id/edit',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ویرایش سفارش خرید',
          authorization: {
            permissions: ['purchasing.update']
          }
        },
        loadComponent: () =>
          import('../pages/purchase-order-editor/purchase-order-editor.page').then(
            (page) => page.PurchaseOrderEditorPage
          )
      }
    ]
  }
];
