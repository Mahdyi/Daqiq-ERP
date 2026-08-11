import type { DataTableColumn } from '@daqiq/ui';

import type { SupplierPayment } from '../models/supplier-payment.model';
import { formatDate, formatMoney, formatNullable } from './payment-format.util';

export function createSupplierPaymentTableColumns(): readonly DataTableColumn<SupplierPayment>[] {
  return [
    { id: 'paymentNumber', field: 'paymentNumber', header: 'شماره پرداخت', sortable: true },
    { id: 'supplierName', field: 'supplierName', header: 'تأمین‌کننده', sortable: true },
    { id: 'cashBankAccountName', field: 'cashBankAccountName', header: 'حساب نقد/بانک' },
    {
      id: 'paymentMethodLabel',
      field: 'paymentMethodLabel',
      header: 'روش پرداخت',
      formatter: (_value, row) => formatNullable(row.paymentMethodLabel)
    },
    {
      id: 'paymentDate',
      field: 'paymentDate',
      header: 'تاریخ',
      sortable: true,
      formatter: (_value, row) => formatDate(row.paymentDate)
    },
    {
      id: 'amount',
      field: 'amount',
      header: 'مبلغ',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.amount)
    },
    { id: 'statusLabel', field: 'statusLabel', header: 'وضعیت' },
    {
      id: 'journalNumber',
      field: 'journalNumber',
      header: 'شماره سند',
      formatter: (_value, row) => formatNullable(row.journalNumber)
    }
  ];
}
