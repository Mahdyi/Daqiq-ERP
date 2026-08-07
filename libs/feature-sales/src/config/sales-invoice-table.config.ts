import type { DataTableColumn } from '@daqiq/ui';

import type { SalesDeliveryLineInvoicingProgress } from '../models/sales-delivery-line-invoicing-progress.model';
import type { SalesInvoiceLine } from '../models/sales-invoice-line.model';
import type { SalesInvoice } from '../models/sales-invoice.model';

export function createSalesInvoiceTableColumns(): readonly DataTableColumn<SalesInvoice>[] {
  return [
    {
      id: 'invoiceNumber',
      field: 'invoiceNumber',
      header: 'شماره فاکتور',
      sortable: true
    },
    {
      id: 'salesDeliveryNumber',
      field: 'salesDeliveryNumber',
      header: 'حواله فروش',
      sortable: true,
      formatter: (_value, row) => row.salesDeliveryNumber ?? '—'
    },
    {
      id: 'salesOrderNumber',
      field: 'salesOrderNumber',
      header: 'سفارش فروش',
      sortable: true,
      formatter: (_value, row) => row.salesOrderNumber ?? '—'
    },
    {
      id: 'customerName',
      field: 'customerName',
      header: 'مشتری',
      sortable: true
    },
    {
      id: 'invoiceDate',
      field: 'invoiceDate',
      header: 'تاریخ فاکتور',
      sortable: true,
      formatter: (_value, row) => formatDate(row.invoiceDate)
    },
    {
      id: 'statusLabel',
      field: 'statusLabel',
      header: 'وضعیت',
      sortable: true
    },
    {
      id: 'totalAmount',
      field: 'totalAmount',
      header: 'مبلغ کل',
      sortable: true,
      align: 'end',
      formatter: (_value, row) => formatMoney(row.totalAmount)
    }
  ];
}

export function createSalesInvoiceLineTableColumns(): readonly DataTableColumn<SalesInvoiceLine>[] {
  return [
    {
      id: 'lineNumber',
      field: 'lineNumber',
      header: 'ردیف'
    },
    {
      id: 'productName',
      valueAccessor: (row) => `${row.productSku} - ${row.productName}`,
      header: 'کالا'
    },
    {
      id: 'quantity',
      field: 'quantity',
      header: 'مقدار',
      align: 'end',
      formatter: (_value, row) => formatNumber(row.quantity)
    },
    {
      id: 'unitLabel',
      field: 'unitLabel',
      header: 'واحد',
      formatter: (_value, row) => row.unitLabel ?? row.unitCode
    },
    {
      id: 'unitPrice',
      field: 'unitPrice',
      header: 'قیمت واحد',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.unitPrice)
    },
    {
      id: 'taxAmount',
      field: 'taxAmount',
      header: 'مالیات',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.taxAmount)
    },
    {
      id: 'lineTotal',
      field: 'lineTotal',
      header: 'جمع خط',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.lineTotal)
    }
  ];
}

export function createSalesDeliveryInvoicingProgressColumns(): readonly DataTableColumn<SalesDeliveryLineInvoicingProgress>[] {
  return [
    {
      id: 'productName',
      valueAccessor: (row) => `${row.productSku} - ${row.productName}`,
      header: 'کالا'
    },
    {
      id: 'deliveredQuantity',
      field: 'deliveredQuantity',
      header: 'تحویل‌شده',
      align: 'end',
      formatter: (_value, row) => formatNumber(row.deliveredQuantity)
    },
    {
      id: 'invoicedQuantity',
      field: 'invoicedQuantity',
      header: 'فاکتور‌شده',
      align: 'end',
      formatter: (_value, row) => formatNumber(row.invoicedQuantity)
    },
    {
      id: 'remainingQuantity',
      field: 'remainingQuantity',
      header: 'باقی‌مانده',
      align: 'end',
      formatter: (_value, row) => formatNumber(row.remainingQuantity)
    },
    {
      id: 'unitLabel',
      field: 'unitLabel',
      header: 'واحد',
      formatter: (_value, row) => row.unitLabel ?? row.unitCode
    }
  ];
}

export function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('fa-IR').format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: 4
  }).format(value);
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: 2
  }).format(value);
}
