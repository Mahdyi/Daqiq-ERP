import { Routes } from '@angular/router';
import { authGuard, authorizationGuard } from '@daqiq/core';

import { StorageLocationRepository } from '../data-access/storage-location-repository.service';
import { WarehouseRepository } from '../data-access/warehouse-repository.service';
import { StorageLocationFacade } from '../facades/storage-location.facade';
import { WarehouseFacade } from '../facades/warehouse.facade';

export const WAREHOUSE_ROUTES: Routes = [
  {
    path: 'warehouses',
    providers: [WarehouseRepository, WarehouseFacade],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'انبارها',
          authorization: {
            permissions: ['warehouses.view']
          }
        },
        loadComponent: () =>
          import('../pages/warehouse-list/warehouse-list.page').then(
            (page) => page.WarehouseListPage
          )
      },
      {
        path: 'new',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ایجاد انبار',
          authorization: {
            permissions: ['warehouses.create']
          }
        },
        loadComponent: () =>
          import('../pages/warehouse-editor/warehouse-editor.page').then(
            (page) => page.WarehouseEditorPage
          )
      },
      {
        path: ':id/edit',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ویرایش انبار',
          authorization: {
            permissions: ['warehouses.update']
          }
        },
        loadComponent: () =>
          import('../pages/warehouse-editor/warehouse-editor.page').then(
            (page) => page.WarehouseEditorPage
          )
      }
    ]
  },
  {
    path: 'storage-locations',
    providers: [WarehouseRepository, StorageLocationRepository, StorageLocationFacade],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'موقعیت‌های انبار',
          authorization: {
            permissions: ['storageLocations.view']
          }
        },
        loadComponent: () =>
          import('../pages/storage-location-list/storage-location-list.page').then(
            (page) => page.StorageLocationListPage
          )
      },
      {
        path: 'new',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ایجاد موقعیت انبار',
          authorization: {
            permissions: ['storageLocations.create']
          }
        },
        loadComponent: () =>
          import('../pages/storage-location-editor/storage-location-editor.page').then(
            (page) => page.StorageLocationEditorPage
          )
      },
      {
        path: ':id/edit',
        canActivate: [authGuard, authorizationGuard],
        data: {
          breadcrumb: 'ویرایش موقعیت انبار',
          authorization: {
            permissions: ['storageLocations.update']
          }
        },
        loadComponent: () =>
          import('../pages/storage-location-editor/storage-location-editor.page').then(
            (page) => page.StorageLocationEditorPage
          )
      }
    ]
  }
];
