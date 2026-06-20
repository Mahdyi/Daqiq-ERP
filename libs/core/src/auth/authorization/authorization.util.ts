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
