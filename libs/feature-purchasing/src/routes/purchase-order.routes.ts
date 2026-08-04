import { Routes } from '@angular/router';
import { authGuard, authorizationGuard } from '@daqiq/core';

import { GoodsReceiptCommandService } from '../data-access/goods-receipt-command.service';
import { GoodsReceiptRepository } from '../data-access/goods-receipt-repository.service';
import { PurchaseOrderCommandService } from '../data-access/purchase-order-command.service';
import { PurchaseOrderReferenceDataService } from '../data-access/purchase-order-reference-data.service';
import { PurchaseOrderRepository } from '../data-access/purchase-order-repository.service';
import { GoodsReceiptPostingFacade } from '../facades/goods-receipt-posting.facade';
import { GoodsReceiptFacade } from '../facades/goods-receipt.facade';
import { PurchaseOrderEditorFacade } from '../facades/purchase-order-editor.facade';
import { PurchaseOrderFacade } from '../facades/purchase-order.facade';

const PURCHASING_PROVIDERS = [
  PurchaseOrderRepository,
  PurchaseOrderCommandService,
  PurchaseOrderReferenceDataService,
  PurchaseOrderFacade,
  PurchaseOrderEditorFacade,
  GoodsReceiptRepository,
  GoodsReceiptCommandService,
  GoodsReceiptFacade,
  GoodsReceiptPostingFacade
];

export const PURCHASING_ROUTES: Routes = [
  {
    path: '',
    providers: PURCHASING_PROVIDERS,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'purchase-orders'
      },
      {
        path: 'purchase-orders',
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
        path: 'purchase-orders/new',
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
        path: 'purchase-orders/:id',
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
        path: 'purchase-orders/:id/edit',
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
      },
      {
        path: 'purchase-orders/:id/receive',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ثبت رسید خرید',
          authorization: {
            permissions: ['receiving.post']
          }
        },
        loadComponent: () =>
          import('../pages/goods-receipt-posting/goods-receipt-posting.page').then(
            (page) => page.GoodsReceiptPostingPage
          )
      },
      {
        path: 'goods-receipts',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'رسیدهای خرید',
          authorization: {
            permissions: ['receiving.view']
          }
        },
        loadComponent: () =>
          import('../pages/goods-receipt-list/goods-receipt-list.page').then(
            (page) => page.GoodsReceiptListPage
          )
      },
      {
        path: 'goods-receipts/:id',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'جزئیات رسید خرید',
          authorization: {
            permissions: ['receiving.view']
          }
        },
        loadComponent: () =>
          import('../pages/goods-receipt-detail/goods-receipt-detail.page').then(
            (page) => page.GoodsReceiptDetailPage
          )
      }
    ]
  }
];

export const PURCHASE_ORDER_ROUTES: Routes = [
  {
    path: '',
    providers: PURCHASING_PROVIDERS,
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
      },
      {
        path: ':id/receive',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ثبت رسید خرید',
          authorization: {
            permissions: ['receiving.post']
          }
        },
        loadComponent: () =>
          import('../pages/goods-receipt-posting/goods-receipt-posting.page').then(
            (page) => page.GoodsReceiptPostingPage
          )
      }
    ]
  }
];
