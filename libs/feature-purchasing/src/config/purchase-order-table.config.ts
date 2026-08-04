import type { DataTableColumn } from '@daqiq/ui';

import type { PurchaseOrderLine } from '../models/purchase-order-line.model';
import type { PurchaseOrder } from '../models/purchase-order.model';

export function createPurchaseOrderTableColumns(): readonly DataTableColumn<PurchaseOrder>[] {
  return [
    {
      id: 'orderNumber',
      field: 'orderNumber',
      header: 'شماره سفارش',
      sortable: true
    },
    {
      id: 'supplierName',
      field: 'supplierName',
      header: 'تأمین‌کننده',
      sortable: true
    },
    {
      id: 'statusLabel',
      field: 'statusLabel',
      header: 'وضعیت',
      sortable: true
    },
    {
      id: 'orderDate',
      field: 'orderDate',
      header: 'تاریخ سفارش',
      sortable: true,
      formatter: (_value, row) => formatDate(row.orderDate)
    },
    {
      id: 'expectedDate',
      field: 'expectedDate',
      header: 'تاریخ مورد انتظار',
      formatter: (_value, row) => (row.expectedDate ? formatDate(row.expectedDate) : '—')
    },
    {
      id: 'totalAmount',
      field: 'totalAmount',
      header: 'مبلغ کل',
      align: 'end',
      sortable: true,
      formatter: (_value, row) => formatNumber(row.totalAmount)
    }
  ];
}

export function createPurchaseOrderLineTableColumns(): readonly DataTableColumn<PurchaseOrderLine>[] {
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
      header: 'واحد'
    },
    {
      id: 'unitPrice',
      field: 'unitPrice',
      header: 'قیمت واحد',
      align: 'end',
      formatter: (_value, row) => formatNumber(row.unitPrice)
    },
    {
      id: 'taxAmount',
      field: 'taxAmount',
      header: 'مالیات',
      align: 'end',
      formatter: (_value, row) => formatNumber(row.taxAmount)
    },
    {
      id: 'lineTotal',
      field: 'lineTotal',
      header: 'جمع خط',
      align: 'end',
      formatter: (_value, row) => formatNumber(row.lineTotal)
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
