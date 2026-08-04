export type AppRole = 'admin' | 'manager' | 'accountant' | 'sales' | 'warehouse' | 'viewer';

export type AppPermission =
  | 'dashboard.view'
  | 'customers.view'
  | 'customers.create'
  | 'customers.update'
  | 'customers.delete'
  | 'products.view'
  | 'products.create'
  | 'products.update'
  | 'products.delete'
  | 'suppliers.view'
  | 'suppliers.create'
  | 'suppliers.update'
  | 'suppliers.delete'
  | 'warehouses.view'
  | 'warehouses.create'
  | 'warehouses.update'
  | 'warehouses.delete'
  | 'storageLocations.view'
  | 'storageLocations.create'
  | 'storageLocations.update'
  | 'storageLocations.delete'
  | 'sales.view'
  | 'sales.create'
  | 'sales.update'
  | 'sales.delete'
  | 'salesOrders.view'
  | 'salesOrders.create'
  | 'salesOrders.update'
  | 'salesOrders.submit'
  | 'salesOrders.confirm'
  | 'salesOrders.cancel'
  | 'salesOrders.delete'
  | 'salesDeliveries.view'
  | 'salesDeliveries.create'
  | 'salesDeliveries.post'
  | 'salesDeliveries.cancel'
  | 'inventory.view'
  | 'inventory.adjust'
  | 'inventory.transfer'
  | 'inventory.delete'
  | 'purchasing.view'
  | 'purchasing.create'
  | 'purchasing.update'
  | 'purchasing.submit'
  | 'purchasing.approve'
  | 'purchasing.cancel'
  | 'purchasing.delete'
  | 'receiving.view'
  | 'receiving.create'
  | 'receiving.post'
  | 'receiving.cancel'
  | 'accounting.view'
  | 'accounting.create'
  | 'accounting.update'
  | 'accounting.delete'
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'audit.view'
  | 'settings.view'
  | 'settings.update'
  | 'lookups.view'
  | 'lookups.create'
  | 'lookups.update'
  | 'lookups.delete'
  | 'featureFlags.view'
  | 'featureFlags.update';

export interface AuthorizationPolicy {
  readonly roles?: readonly AppRole[];
  readonly permissions?: readonly AppPermission[];
  readonly requireAllPermissions?: boolean;
}

export const ROLE_PERMISSIONS = {
  admin: [
    'dashboard.view',
    'customers.view',
    'customers.create',
    'customers.update',
    'customers.delete',
    'products.view',
    'products.create',
    'products.update',
    'products.delete',
    'suppliers.view',
    'suppliers.create',
    'suppliers.update',
    'suppliers.delete',
    'warehouses.view',
    'warehouses.create',
    'warehouses.update',
    'warehouses.delete',
    'storageLocations.view',
    'storageLocations.create',
    'storageLocations.update',
    'storageLocations.delete',
    'sales.view',
    'sales.create',
    'sales.update',
    'sales.delete',
    'salesOrders.view',
    'salesOrders.create',
    'salesOrders.update',
    'salesOrders.submit',
    'salesOrders.confirm',
    'salesOrders.cancel',
    'salesOrders.delete',
    'salesDeliveries.view',
    'salesDeliveries.create',
    'salesDeliveries.post',
    'salesDeliveries.cancel',
    'inventory.view',
    'inventory.adjust',
    'inventory.transfer',
    'inventory.delete',
    'purchasing.view',
    'purchasing.create',
    'purchasing.update',
    'purchasing.submit',
    'purchasing.approve',
    'purchasing.cancel',
    'purchasing.delete',
    'receiving.view',
    'receiving.create',
    'receiving.post',
    'receiving.cancel',
    'accounting.view',
    'accounting.create',
    'accounting.update',
    'accounting.delete',
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'audit.view',
    'settings.view',
    'settings.update',
    'lookups.view',
    'lookups.create',
    'lookups.update',
    'lookups.delete',
    'featureFlags.view',
    'featureFlags.update'
  ],
  manager: [
    'dashboard.view',
    'customers.view',
    'customers.create',
    'customers.update',
    'products.view',
    'products.create',
    'products.update',
    'suppliers.view',
    'suppliers.create',
    'suppliers.update',
    'warehouses.view',
    'warehouses.create',
    'warehouses.update',
    'storageLocations.view',
    'storageLocations.create',
    'storageLocations.update',
    'sales.view',
    'salesOrders.view',
    'salesOrders.create',
    'salesOrders.update',
    'salesOrders.submit',
    'salesOrders.confirm',
    'salesOrders.cancel',
    'salesDeliveries.view',
    'salesDeliveries.create',
    'salesDeliveries.post',
    'salesDeliveries.cancel',
    'inventory.view',
    'inventory.adjust',
    'inventory.transfer',
    'purchasing.view',
    'purchasing.create',
    'purchasing.update',
    'purchasing.submit',
    'purchasing.approve',
    'purchasing.cancel',
    'receiving.view',
    'receiving.create',
    'receiving.post',
    'receiving.cancel',
    'accounting.view',
    'settings.view',
    'lookups.view',
    'featureFlags.view'
  ],
  accountant: [
    'dashboard.view',
    'customers.view',
    'products.view',
    'suppliers.view',
    'suppliers.update',
    'warehouses.view',
    'storageLocations.view',
    'inventory.view',
    'salesOrders.view',
    'salesDeliveries.view',
    'purchasing.view',
    'receiving.view',
    'accounting.view',
    'accounting.create',
    'accounting.update'
  ],
  sales: [
    'dashboard.view',
    'customers.view',
    'customers.create',
    'customers.update',
    'products.view',
    'sales.view',
    'sales.create',
    'sales.update',
    'salesOrders.view',
    'salesOrders.create',
    'salesOrders.update',
    'salesOrders.submit',
    'salesOrders.cancel',
    'salesDeliveries.view',
    'salesDeliveries.create'
  ],
  warehouse: [
    'dashboard.view',
    'products.view',
    'products.update',
    'suppliers.view',
    'warehouses.view',
    'warehouses.create',
    'warehouses.update',
    'storageLocations.view',
    'storageLocations.create',
    'storageLocations.update',
    'inventory.view',
    'inventory.adjust',
    'inventory.transfer',
    'salesOrders.view',
    'salesDeliveries.view',
    'salesDeliveries.create',
    'salesDeliveries.post',
    'purchasing.view',
    'receiving.view',
    'receiving.create',
    'receiving.post'
  ],
  viewer: ['dashboard.view']
} satisfies Record<AppRole, readonly AppPermission[]>;
