import type { DataTableColumn } from '@daqiq/ui';

import type { CustomerReceipt } from '../models/customer-receipt.model';
import { formatDate, formatMoney, formatNullable } from './payment-format.util';

export function createCustomerReceiptTableColumns(): readonly DataTableColumn<CustomerReceipt>[] {
  return [
    { id: 'receiptNumber', field: 'receiptNumber', header: 'شماره دریافت', sortable: true },
    { id: 'customerName', field: 'customerName', header: 'مشتری', sortable: true },
    { id: 'cashBankAccountName', field: 'cashBankAccountName', header: 'حساب نقد/بانک' },
    {
      id: 'paymentMethodLabel',
      field: 'paymentMethodLabel',
      header: 'روش پرداخت',
      formatter: (_value, row) => formatNullable(row.paymentMethodLabel)
    },
    {
      id: 'receiptDate',
      field: 'receiptDate',
      header: 'تاریخ',
      sortable: true,
      formatter: (_value, row) => formatDate(row.receiptDate)
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
