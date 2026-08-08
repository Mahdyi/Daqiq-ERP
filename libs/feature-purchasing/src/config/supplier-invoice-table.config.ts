import type { DataTableColumn } from '@daqiq/ui';

import type { GoodsReceiptLineSupplierInvoicingProgress } from '../models/goods-receipt-line-supplier-invoicing-progress.model';
import type { SupplierInvoiceLine } from '../models/supplier-invoice-line.model';
import type { SupplierInvoice } from '../models/supplier-invoice.model';

export function createSupplierInvoiceTableColumns(): readonly DataTableColumn<SupplierInvoice>[] {
  return [
    {
      id: 'invoiceNumber',
      field: 'invoiceNumber',
      header: 'شماره داخلی',
      sortable: true
    },
    {
      id: 'supplierInvoiceNumber',
      field: 'supplierInvoiceNumber',
      header: 'شماره فاکتور تأمین‌کننده',
      sortable: true,
      formatter: (_value, row) => row.supplierInvoiceNumber ?? '—'
    },
    {
      id: 'supplierName',
      field: 'supplierName',
      header: 'تأمین‌کننده',
      sortable: true
    },
    {
      id: 'purchaseOrderNumber',
      field: 'purchaseOrderNumber',
      header: 'سفارش خرید',
      sortable: true,
      formatter: (_value, row) => row.purchaseOrderNumber ?? '—'
    },
    {
      id: 'goodsReceiptNumber',
      field: 'goodsReceiptNumber',
      header: 'رسید خرید',
      sortable: true,
      formatter: (_value, row) => row.goodsReceiptNumber ?? '—'
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

export function createSupplierInvoiceLineTableColumns(): readonly DataTableColumn<SupplierInvoiceLine>[] {
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

export function createGoodsReceiptSupplierInvoicingProgressColumns(): readonly DataTableColumn<GoodsReceiptLineSupplierInvoicingProgress>[] {
  return [
    {
      id: 'productName',
      valueAccessor: (row) => `${row.productSku} - ${row.productName}`,
      header: 'کالا'
    },
    {
      id: 'receivedQuantity',
      field: 'receivedQuantity',
      header: 'دریافت‌شده',
      align: 'end',
      formatter: (_value, row) => formatNumber(row.receivedQuantity)
    },
    {
      id: 'invoicedQuantity',
      field: 'invoicedQuantity',
      header: 'فاکتورشده',
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
