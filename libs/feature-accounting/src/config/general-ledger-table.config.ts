import type { DataTableColumn } from '@daqiq/ui';

import type { GeneralLedgerLine } from '../models/general-ledger-line.model';
import { formatDate, formatMoney, formatNullable } from './accounting-format.util';

export function createGeneralLedgerTableColumns(): readonly DataTableColumn<GeneralLedgerLine>[] {
  return [
    {
      id: 'journalDate',
      field: 'journalDate',
      header: 'تاریخ',
      formatter: (_value, row) => formatDate(row.journalDate)
    },
    { id: 'journalNumber', field: 'journalNumber', header: 'شماره سند' },
    { id: 'accountCode', field: 'accountCode', header: 'کد حساب' },
    { id: 'accountName', field: 'accountName', header: 'نام حساب' },
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
    },
    { id: 'sourceTypeCode', field: 'sourceTypeCode', header: 'منبع' },
    {
      id: 'postedByEmail',
      field: 'postedByEmail',
      header: 'ثبت‌کننده',
      formatter: (_value, row) => formatNullable(row.postedByEmail)
    }
  ];
}
