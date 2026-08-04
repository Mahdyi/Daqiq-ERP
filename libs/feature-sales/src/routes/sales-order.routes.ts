import { Routes } from '@angular/router';
import { authGuard, authorizationGuard } from '@daqiq/core';

import { SalesDeliveryCommandService } from '../data-access/sales-delivery-command.service';
import { SalesDeliveryRepository } from '../data-access/sales-delivery-repository.service';
import { SalesOrderCommandService } from '../data-access/sales-order-command.service';
import { SalesOrderReferenceDataService } from '../data-access/sales-order-reference-data.service';
import { SalesOrderRepository } from '../data-access/sales-order-repository.service';
import { SalesDeliveryPostingFacade } from '../facades/sales-delivery-posting.facade';
import { SalesDeliveryFacade } from '../facades/sales-delivery.facade';
import { SalesOrderEditorFacade } from '../facades/sales-order-editor.facade';
import { SalesOrderFacade } from '../facades/sales-order.facade';

const SALES_PROVIDERS = [
  SalesOrderRepository,
  SalesOrderCommandService,
  SalesDeliveryRepository,
  SalesDeliveryCommandService,
  SalesOrderReferenceDataService,
  SalesOrderFacade,
  SalesOrderEditorFacade,
  SalesDeliveryFacade,
  SalesDeliveryPostingFacade
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
      },
      {
        path: 'sales-orders/:id/deliver',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ثبت حواله فروش',
          authorization: {
            permissions: ['salesDeliveries.post']
          }
        },
        loadComponent: () =>
          import('../pages/sales-delivery-posting/sales-delivery-posting.page').then(
            (page) => page.SalesDeliveryPostingPage
          )
      },
      {
        path: 'sales-deliveries',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'حواله‌های فروش',
          authorization: {
            permissions: ['salesDeliveries.view']
          }
        },
        loadComponent: () =>
          import('../pages/sales-delivery-list/sales-delivery-list.page').then(
            (page) => page.SalesDeliveryListPage
          )
      },
      {
        path: 'sales-deliveries/:id',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'جزئیات حواله فروش',
          authorization: {
            permissions: ['salesDeliveries.view']
          }
        },
        loadComponent: () =>
          import('../pages/sales-delivery-detail/sales-delivery-detail.page').then(
            (page) => page.SalesDeliveryDetailPage
          )
      }
    ]
  }
];
