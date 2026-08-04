import type { DataTableColumn } from '@daqiq/ui';

import type { GoodsReceiptLine } from '../models/goods-receipt-line.model';
import type { GoodsReceipt } from '../models/goods-receipt.model';
import type { PurchaseOrderLineReceivingProgress } from '../models/purchase-order-receiving-progress.model';
import { formatDate, formatNumber } from './purchase-order-table.config';

export function createGoodsReceiptTableColumns(): readonly DataTableColumn<GoodsReceipt>[] {
  return [
    {
      id: 'receiptNumber',
      field: 'receiptNumber',
      header: 'شماره رسید',
      sortable: true
    },
    {
      id: 'purchaseOrderNumber',
      field: 'purchaseOrderNumber',
      header: 'سفارش خرید',
      sortable: true
    },
    {
      id: 'supplierName',
      field: 'supplierName',
      header: 'تأمین‌کننده',
      sortable: true
    },
    {
      id: 'warehouseName',
      field: 'warehouseName',
      header: 'انبار',
      sortable: true
    },
    {
      id: 'statusLabel',
      field: 'statusLabel',
      header: 'وضعیت',
      sortable: true
    },
    {
      id: 'receiptDate',
      field: 'receiptDate',
      header: 'تاریخ رسید',
      sortable: true,
      formatter: (_value, row) => formatDate(row.receiptDate)
    }
  ];
}

export function createGoodsReceiptLineTableColumns(): readonly DataTableColumn<GoodsReceiptLine>[] {
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
      id: 'receivedQuantity',
      field: 'receivedQuantity',
      header: 'مقدار رسید',
      align: 'end',
      formatter: (_value, row) => formatNumber(row.receivedQuantity)
    },
    {
      id: 'unitLabel',
      field: 'unitLabel',
      header: 'واحد'
    },
    {
      id: 'storageLocationName',
      valueAccessor: (row) => row.storageLocationName ?? row.storageLocationCode ?? '—',
      header: 'موقعیت انبار'
    },
    {
      id: 'inventoryMovementNumber',
      valueAccessor: (row) => row.inventoryMovementNumber ?? '—',
      header: 'سند انبار'
    }
  ];
}

export function createReceivingProgressTableColumns():
  readonly DataTableColumn<PurchaseOrderLineReceivingProgress>[] {
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
      id: 'receivedQuantity',
      field: 'receivedQuantity',
      header: 'رسیدشده',
      align: 'end',
      formatter: (_value, row) => formatNumber(row.receivedQuantity)
    },
    {
      id: 'remainingQuantity',
      field: 'remainingQuantity',
      header: 'مانده',
      align: 'end',
      formatter: (_value, row) => formatNumber(row.remainingQuantity)
    },
    {
      id: 'unitLabel',
      field: 'unitLabel',
      header: 'واحد'
    }
  ];
}
