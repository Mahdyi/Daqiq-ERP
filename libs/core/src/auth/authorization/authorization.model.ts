export type AppRole = 'admin' | 'manager' | 'accountant' | 'sales' | 'warehouse' | 'viewer';

export type AppPermission =
  | 'dashboard.view'
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
  | 'settings.view'
  | 'settings.update';

export interface AuthorizationPolicy {
  readonly roles?: readonly AppRole[];
  readonly permissions?: readonly AppPermission[];
  readonly requireAllPermissions?: boolean;
}

export const ROLE_PERMISSIONS = {
  admin: [
    'dashboard.view',
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
    'settings.view',
    'settings.update'
  ],
  manager: ['dashboard.view', 'sales.view', 'inventory.view', 'accounting.view'],
  accountant: [
    'dashboard.view',
    'accounting.view',
    'accounting.create',
    'accounting.update'
  ],
  sales: ['dashboard.view', 'sales.view', 'sales.create', 'sales.update'],
  warehouse: ['dashboard.view', 'inventory.view', 'inventory.create', 'inventory.update'],
  viewer: ['dashboard.view']
} satisfies Record<AppRole, readonly AppPermission[]>;
