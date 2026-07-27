import { AppRole } from '@daqiq/core';

export interface UserRoleOption {
  readonly label: string;
  readonly value: AppRole;
}

export const USER_ROLE_OPTIONS: readonly UserRoleOption[] = [
  { label: 'مدیر سیستم', value: 'admin' },
  { label: 'مدیر', value: 'manager' },
  { label: 'فروش', value: 'sales' },
  { label: 'حسابدار', value: 'accountant' },
  { label: 'انبار', value: 'warehouse' },
  { label: 'مشاهده‌گر', value: 'viewer' }
];

export function formatUserRoles(roles: readonly AppRole[]): string {
  return roles
    .map((role) => USER_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role)
    .join('، ');
}
