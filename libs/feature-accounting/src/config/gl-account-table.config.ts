import type { DataTableColumn } from '@daqiq/ui';

import { formatBoolean, formatNullable } from './accounting-format.util';
import type { GlAccount } from '../models/gl-account.model';

export function createGlAccountTableColumns(): readonly DataTableColumn<GlAccount>[] {
  return [
    { id: 'accountCode', field: 'accountCode', header: 'کد حساب', sortable: true },
    { id: 'accountName', field: 'accountName', header: 'نام حساب', sortable: true },
    { id: 'accountTypeLabel', field: 'accountTypeLabel', header: 'نوع حساب', sortable: true },
    {
      id: 'parentAccountName',
      field: 'parentAccountName',
      header: 'حساب والد',
      formatter: (_value, row) =>
        row.parentAccountCode ? `${row.parentAccountCode} - ${row.parentAccountName ?? ''}` : '—'
    },
    {
      id: 'isPostable',
      field: 'isPostable',
      header: 'قابل ثبت',
      formatter: (_value, row) => formatBoolean(row.isPostable)
    },
    {
      id: 'active',
      field: 'active',
      header: 'فعال',
      formatter: (_value, row) => formatBoolean(row.active)
    },
    {
      id: 'description',
      field: 'description',
      header: 'توضیح',
      formatter: (_value, row) => formatNullable(row.description)
    }
  ];
}
