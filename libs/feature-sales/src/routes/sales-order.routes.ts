import { Routes } from '@angular/router';
import { authGuard, authorizationGuard } from '@daqiq/core';

import { SalesOrderCommandService } from '../data-access/sales-order-command.service';
import { SalesOrderReferenceDataService } from '../data-access/sales-order-reference-data.service';
import { SalesOrderRepository } from '../data-access/sales-order-repository.service';
import { SalesOrderEditorFacade } from '../facades/sales-order-editor.facade';
import { SalesOrderFacade } from '../facades/sales-order.facade';

const SALES_PROVIDERS = [
  SalesOrderRepository,
  SalesOrderCommandService,
  SalesOrderReferenceDataService,
  SalesOrderFacade,
  SalesOrderEditorFacade
];

export const SALES_ROUTES: Routes = [
  {
    path: '',
    providers: SALES_PROVIDERS,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'sales-orders'
      },
      {
        path: 'sales-orders',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'سفارش‌های فروش',
          authorization: {
            permissions: ['salesOrders.view']
          }
        },
        loadComponent: () =>
          import('../pages/sales-order-list/sales-order-list.page').then(
            (page) => page.SalesOrderListPage
          )
      },
      {
        path: 'sales-orders/new',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ایجاد سفارش فروش',
          authorization: {
            permissions: ['salesOrders.create']
          }
        },
        loadComponent: () =>
          import('../pages/sales-order-editor/sales-order-editor.page').then(
            (page) => page.SalesOrderEditorPage
          )
      },
      {
        path: 'sales-orders/:id',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'جزئیات سفارش فروش',
          authorization: {
            permissions: ['salesOrders.view']
          }
        },
        loadComponent: () =>
          import('../pages/sales-order-detail/sales-order-detail.page').then(
            (page) => page.SalesOrderDetailPage
          )
      },
      {
        path: 'sales-orders/:id/edit',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ویرایش سفارش فروش',
          authorization: {
            permissions: ['salesOrders.update']
          }
        },
        loadComponent: () =>
          import('../pages/sales-order-editor/sales-order-editor.page').then(
            (page) => page.SalesOrderEditorPage
          )
      }
    ]
  }
];
