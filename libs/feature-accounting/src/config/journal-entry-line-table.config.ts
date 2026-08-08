import type { DataTableColumn } from '@daqiq/ui';

import type { JournalEntryLine } from '../models/journal-entry-line.model';
import { formatMoney, formatNullable } from './accounting-format.util';

export function createJournalEntryLineTableColumns(): readonly DataTableColumn<JournalEntryLine>[] {
  return [
    { id: 'lineNumber', field: 'lineNumber', header: 'ردیف' },
    {
      id: 'account',
      valueAccessor: (row) => `${row.accountCode} - ${row.accountName}`,
      header: 'حساب'
    },
    {
      id: 'description',
      field: 'description',
      header: 'شرح',
      formatter: (_value, row) => formatNullable(row.description)
    },
    {
      id: 'debitAmount',
      field: 'debitAmount',
      header: 'بدهکار',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.debitAmount)
    },
    {
      id: 'creditAmount',
      field: 'creditAmount',
      header: 'بستانکار',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.creditAmount)
    }
  ];
}
