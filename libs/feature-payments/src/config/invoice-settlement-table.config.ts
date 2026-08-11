import type { DataTableColumn } from '@daqiq/ui';

import type { SalesInvoiceSettlement, SupplierInvoiceSettlement } from '../models/settlement.model';
import { formatDate, formatMoney, formatSettlementStatus } from './payment-format.util';

export function createSalesSettlementTableColumns(): readonly DataTableColumn<SalesInvoiceSettlement>[] {
  return [
    { id: 'invoiceNumber', field: 'invoiceNumber', header: 'شماره فاکتور', sortable: true },
    { id: 'customerName', field: 'customerName', header: 'مشتری', sortable: true },
    {
      id: 'invoiceDate',
      field: 'invoiceDate',
      header: 'تاریخ',
      formatter: (_value, row) => formatDate(row.invoiceDate)
    },
    {
      id: 'totalAmount',
      field: 'totalAmount',
      header: 'مبلغ کل',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.totalAmount)
    },
    {
      id: 'paidAmount',
      field: 'paidAmount',
      header: 'پرداخت‌شده',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.paidAmount)
    },
    {
      id: 'remainingAmount',
      field: 'remainingAmount',
      header: 'مانده',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.remainingAmount)
    },
    {
      id: 'settlementStatus',
      field: 'settlementStatus',
      header: 'وضعیت',
      formatter: (_value, row) => formatSettlementStatus(row.settlementStatus)
    }
  ];
}

export function createSupplierSettlementTableColumns(): readonly DataTableColumn<SupplierInvoiceSettlement>[] {
  return [
    { id: 'invoiceNumber', field: 'invoiceNumber', header: 'شماره فاکتور', sortable: true },
    { id: 'supplierName', field: 'supplierName', header: 'تأمین‌کننده', sortable: true },
    {
      id: 'invoiceDate',
      field: 'invoiceDate',
      header: 'تاریخ',
      formatter: (_value, row) => formatDate(row.invoiceDate)
    },
    {
      id: 'totalAmount',
      field: 'totalAmount',
      header: 'مبلغ کل',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.totalAmount)
    },
    {
      id: 'paidAmount',
      field: 'paidAmount',
      header: 'پرداخت‌شده',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.paidAmount)
    },
    {
      id: 'remainingAmount',
      field: 'remainingAmount',
      header: 'مانده',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.remainingAmount)
    },
    {
      id: 'settlementStatus',
      field: 'settlementStatus',
      header: 'وضعیت',
      formatter: (_value, row) => formatSettlementStatus(row.settlementStatus)
    }
  ];
}
