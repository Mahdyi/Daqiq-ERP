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
  | 'sales.view'
  | 'sales.create'
  | 'sales.update'
  | 'sales.delete'
  | 'inventory.view'
  | 'inventory.create'
  | 'inventory.update'
  | 'inventory.delete'
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
    'sales.view',
    'sales.create',
    'sales.update',
    'sales.delete',
    'inventory.view',
    'inventory.create',
    'inventory.update',
    'inventory.delete',
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
    'sales.view',
    'inventory.view',
    'accounting.view',
    'settings.view',
    'lookups.view',
    'featureFlags.view'
  ],
  accountant: [
    'dashboard.view',
    'customers.view',
    'products.view',
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
    'sales.update'
  ],
  warehouse: [
    'dashboard.view',
    'products.view',
    'products.update',
    'inventory.view',
    'inventory.create',
    'inventory.update'
  ],
  viewer: ['dashboard.view']
} satisfies Record<AppRole, readonly AppPermission[]>;
