import { AppPermission, AppRole, ROLE_PERMISSIONS } from './authorization.model';

const APP_ROLES = [
  'admin',
  'manager',
  'accountant',
  'sales',
  'warehouse',
  'viewer'
] as const satisfies readonly AppRole[];

const APP_PERMISSIONS = [
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
  'inventory.view',
  'inventory.adjust',
  'inventory.transfer',
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
] as const satisfies readonly AppPermission[];

export function isAppRole(value: string): value is AppRole {
  return APP_ROLES.includes(value as AppRole);
}

export function isAppPermission(value: string): value is AppPermission {
  return APP_PERMISSIONS.includes(value as AppPermission);
}

export function normalizeRoles(roles: readonly string[]): readonly AppRole[] {
  return uniqueValues(roles.filter(isAppRole));
}

export function normalizePermissions(
  permissions: readonly string[]
): readonly AppPermission[] {
  return uniqueValues(permissions.filter(isAppPermission));
}

export function resolvePermissionsForRoles(
  roles: readonly AppRole[]
): readonly AppPermission[] {
  const permissions = roles.flatMap((role) => ROLE_PERMISSIONS[role]);
  return uniqueValues(permissions);
}

function uniqueValues<TValue extends string>(values: readonly TValue[]): readonly TValue[] {
  return [...new Set(values)];
}
