import type { DataTableColumn } from '@daqiq/ui';

import type { AccountingPeriod } from '../models/accounting-period.model';
import { formatBoolean, formatDate } from './accounting-format.util';

export function createAccountingPeriodTableColumns(): readonly DataTableColumn<AccountingPeriod>[] {
  return [
    { id: 'periodCode', field: 'periodCode', header: 'کد دوره', sortable: true },
    { id: 'periodName', field: 'periodName', header: 'نام دوره', sortable: true },
    {
      id: 'startDate',
      field: 'startDate',
      header: 'تاریخ شروع',
      formatter: (_value, row) => formatDate(row.startDate)
    },
    {
      id: 'endDate',
      field: 'endDate',
      header: 'تاریخ پایان',
      formatter: (_value, row) => formatDate(row.endDate)
    },
    {
      id: 'isClosed',
      field: 'isClosed',
      header: 'بسته',
      formatter: (_value, row) => formatBoolean(row.isClosed)
    }
  ];
}
