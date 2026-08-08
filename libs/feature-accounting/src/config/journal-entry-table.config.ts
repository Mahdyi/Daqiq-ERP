import type { DataTableColumn } from '@daqiq/ui';

import type { JournalEntry } from '../models/journal-entry.model';
import { formatDate, formatMoney, formatNullable } from './accounting-format.util';

export function createJournalEntryTableColumns(): readonly DataTableColumn<JournalEntry>[] {
  return [
    { id: 'journalNumber', field: 'journalNumber', header: 'شماره سند', sortable: true },
    { id: 'statusLabel', field: 'statusLabel', header: 'وضعیت', sortable: true },
    { id: 'sourceTypeLabel', field: 'sourceTypeLabel', header: 'منبع', sortable: true },
    {
      id: 'journalDate',
      field: 'journalDate',
      header: 'تاریخ سند',
      sortable: true,
      formatter: (_value, row) => formatDate(row.journalDate)
    },
    { id: 'periodCode', field: 'periodCode', header: 'دوره', sortable: true },
    {
      id: 'totalDebit',
      field: 'totalDebit',
      header: 'بدهکار',
      align: 'end',
      sortable: true,
      formatter: (_value, row) => formatMoney(row.totalDebit)
    },
    {
      id: 'totalCredit',
      field: 'totalCredit',
      header: 'بستانکار',
      align: 'end',
      sortable: true,
      formatter: (_value, row) => formatMoney(row.totalCredit)
    },
    {
      id: 'postedByEmail',
      field: 'postedByEmail',
      header: 'ثبت‌کننده',
      formatter: (_value, row) => formatNullable(row.postedByEmail)
    }
  ];
}
