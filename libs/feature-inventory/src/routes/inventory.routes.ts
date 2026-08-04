import { Routes } from '@angular/router';
import { authGuard, authorizationGuard } from '@daqiq/core';

import { InventoryBalanceRepository } from '../data-access/inventory-balance-repository.service';
import { InventoryMovementRepository } from '../data-access/inventory-movement-repository.service';
import { InventoryReferenceDataService } from '../data-access/inventory-reference-data.service';
import { InventoryTransactionService } from '../data-access/inventory-transaction.service';
import { InventoryBalanceFacade } from '../facades/inventory-balance.facade';
import { InventoryMovementFacade } from '../facades/inventory-movement.facade';
import { InventoryTransactionFacade } from '../facades/inventory-transaction.facade';

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    providers: [
      InventoryBalanceRepository,
      InventoryMovementRepository,
      InventoryReferenceDataService,
      InventoryTransactionService,
      InventoryBalanceFacade,
      InventoryMovementFacade,
      InventoryTransactionFacade
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'balances'
      },
      {
        path: 'balances',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'موجودی انبار',
          authorization: {
            permissions: ['inventory.view']
          }
        },
        loadComponent: () =>
          import('../pages/inventory-balance-list/inventory-balance-list.page').then(
            (page) => page.InventoryBalanceListPage
          )
      },
      {
        path: 'movements',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'حرکات موجودی',
          authorization: {
            permissions: ['inventory.view']
          }
        },
        loadComponent: () =>
          import('../pages/inventory-movement-list/inventory-movement-list.page').then(
            (page) => page.InventoryMovementListPage
          )
      },
      {
        path: 'adjustment',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'اصلاح موجودی',
          authorization: {
            permissions: ['inventory.adjust']
          }
        },
        loadComponent: () =>
          import('../pages/inventory-adjustment/inventory-adjustment.page').then(
            (page) => page.InventoryAdjustmentPage
          )
      },
      {
        path: 'transfer',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'انتقال موجودی',
          authorization: {
            permissions: ['inventory.transfer']
          }
        },
        loadComponent: () =>
          import('../pages/inventory-transfer/inventory-transfer.page').then(
            (page) => page.InventoryTransferPage
          )
      }
    ]
  }
];
