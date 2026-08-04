import type { DataTableColumn } from '@daqiq/ui';

import type { SalesDeliveryLine } from '../models/sales-delivery-line.model';
import type { SalesDelivery } from '../models/sales-delivery.model';
import type { SalesOrderLineDeliveryProgress } from '../models/sales-order-line-delivery-progress.model';

export function createSalesDeliveryTableColumns(): readonly DataTableColumn<SalesDelivery>[] {
  return [
    {
      id: 'deliveryNumber',
      field: 'deliveryNumber',
      header: 'شماره حواله',
      sortable: true
    },
    {
      id: 'salesOrderNumber',
      field: 'salesOrderNumber',
      header: 'سفارش فروش',
      sortable: true
    },
    {
      id: 'customerName',
      field: 'customerName',
      header: 'مشتری',
      sortable: true
    },
    {
      id: 'warehouseName',
      field: 'warehouseName',
      header: 'انبار',
      sortable: true
    },
    {
      id: 'deliveryDate',
      field: 'deliveryDate',
      header: 'تاریخ حواله',
      sortable: true,
      formatter: (_value, row) => formatDate(row.deliveryDate)
    },
    {
      id: 'statusLabel',
      field: 'statusLabel',
      header: 'وضعیت',
      sortable: true
    },
    {
      id: 'postedByEmail',
      field: 'postedByEmail',
      header: 'ثبت‌کننده',
      formatter: (_value, row) => row.postedByEmail ?? '—'
    }
  ];
}

export function createSalesDeliveryLineTableColumns(): readonly DataTableColumn<SalesDeliveryLine>[] {
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
      id: 'shippedQuantity',
      field: 'shippedQuantity',
      header: 'مقدار ارسال',
      align: 'end',
      formatter: (_value, row) => formatNumber(row.shippedQuantity)
    },
    {
      id: 'unitLabel',
      field: 'unitLabel',
      header: 'واحد',
      formatter: (_value, row) => row.unitLabel ?? row.unitCode
    },
    {
      id: 'storageLocationName',
      field: 'storageLocationName',
      header: 'موقعیت',
      formatter: (_value, row) => row.storageLocationName ?? '—'
    },
    {
      id: 'inventoryMovementId',
      field: 'inventoryMovementId',
      header: 'حرکت موجودی',
      formatter: (_value, row) => row.inventoryMovementId ?? '—'
    }
  ];
}

export function createSalesOrderDeliveryProgressColumns(): readonly DataTableColumn<SalesOrderLineDeliveryProgress>[] {
  return [
    {
      id: 'productName',
      valueAccessor: (row) => `${row.productSku} - ${row.productName}`,
      header: 'کالا'
    },
    {
      id: 'orderedQuantity',
      field: 'orderedQuantity',
      header: 'سفارش‌شده',
      align: 'end',
      formatter: (_value, row) => formatNumber(row.orderedQuantity)
    },
    {
      id: 'shippedQuantity',
      field: 'shippedQuantity',
      header: 'ارسال‌شده',
      align: 'end',
      formatter: (_value, row) => formatNumber(row.shippedQuantity)
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
