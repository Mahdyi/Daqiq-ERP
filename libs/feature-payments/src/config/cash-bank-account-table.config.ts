import type { DataTableColumn } from '@daqiq/ui';

import type { CashBankAccount } from '../models/cash-bank-account.model';
import { formatBoolean, formatNullable } from './payment-format.util';

export function createCashBankAccountTableColumns(): readonly DataTableColumn<CashBankAccount>[] {
  return [
    { id: 'accountCode', field: 'accountCode', header: 'کد', sortable: true },
    { id: 'accountName', field: 'accountName', header: 'نام', sortable: true },
    { id: 'accountTypeLabel', field: 'accountTypeLabel', header: 'نوع', sortable: true },
    {
      id: 'currencyLabel',
      field: 'currencyLabel',
      header: 'ارز',
      formatter: (_value, row) => formatNullable(row.currencyLabel)
    },
    {
      id: 'glAccount',
      header: 'حساب معین',
      valueAccessor: (row) => `${row.glAccountCode} - ${row.glAccountName}`
    },
    {
      id: 'active',
      field: 'active',
      header: 'فعال',
      formatter: (_value, row) => formatBoolean(row.active)
    }
  ];
}
