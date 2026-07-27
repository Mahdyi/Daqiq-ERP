import { DataTableColumn } from '@daqiq/ui';

import { formatUserRoles } from './user-role.config';
import { ManagedUser } from '../models/user.model';

export const USER_TABLE_COLUMNS: readonly DataTableColumn<ManagedUser>[] = [
  {
    id: 'email',
    field: 'email',
    header: 'ایمیل',
    sortable: true
  },
  {
    id: 'displayName',
    field: 'displayName',
    header: 'نام نمایشی',
    sortable: true
  },
  {
    id: 'roles',
    valueAccessor: (user) => user.roles,
    header: 'نقش‌ها',
    formatter: (_value, user) => formatUserRoles(user.roles)
  },
  {
    id: 'active',
    field: 'active',
    header: 'وضعیت',
    formatter: (value) => (value === true ? 'فعال' : 'غیرفعال'),
    align: 'center'
  },
  {
    id: 'lastLoginAt',
    field: 'lastLoginAt',
    header: 'آخرین ورود',
    formatter: (value) => (value instanceof Date ? value.toLocaleString('fa-IR') : 'بدون ورود')
  }
];
