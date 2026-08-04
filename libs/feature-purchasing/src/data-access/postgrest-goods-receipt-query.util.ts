import type { ApiRequestParamValue } from '@daqiq/core';

import type { GoodsReceiptLine } from '../models/goods-receipt-line.model';
import type { GoodsReceiptQuery } from '../models/goods-receipt-query.model';
import type { GoodsReceipt } from '../models/goods-receipt.model';
import type { PurchaseOrderLineReceivingProgress } from '../models/purchase-order-receiving-progress.model';
import type { PostgrestListRequest } from './postgrest-purchase-order-query.util';

export const GOODS_RECEIPT_SELECT_COLUMNS =
  'id,receipt_number,purchase_order_id,purchase_order_number,supplier_id,supplier_code,supplier_name,status_code,status_label,receipt_date,warehouse_id,warehouse_code,warehouse_name,notes,posted_by_email,posted_at,cancelled_by_email,cancelled_at,created_by_email,created_at,updated_at';

export const GOODS_RECEIPT_LINE_SELECT_COLUMNS =
  'id,goods_receipt_id,line_number,purchase_order_line_id,product_id,product_sku,product_name,received_quantity,unit_code,unit_label,storage_location_id,storage_location_code,storage_location_name,inventory_movement_id,inventory_movement_number,notes';

export const PURCHASE_ORDER_RECEIVING_PROGRESS_SELECT_COLUMNS =
  'purchase_order_line_id,purchase_order_id,product_id,product_sku,product_name,ordered_quantity,received_quantity,remaining_quantity,unit_lookup_value_id,unit_code,unit_label';

const GOODS_RECEIPT_SORT_FIELD_MAP = {
  id: 'id',
  receiptNumber: 'receipt_number',
  purchaseOrderId: 'purchase_order_id',
  purchaseOrderNumber: 'purchase_order_number',
  supplierId: 'supplier_id',
  supplierCode: 'supplier_code',
  supplierName: 'supplier_name',
  statusCode: 'status_code',
  statusLabel: 'status_label',
  receiptDate: 'receipt_date',
  warehouseId: 'warehouse_id',
  warehouseCode: 'warehouse_code',
  warehouseName: 'warehouse_name',
  notes: 'notes',
  postedByEmail: 'posted_by_email',
  postedAt: 'posted_at',
  cancelledByEmail: 'cancelled_by_email',
  cancelledAt: 'cancelled_at',
  createdByEmail: 'created_by_email',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
} satisfies Record<keyof GoodsReceipt, string>;

const GOODS_RECEIPT_LINE_SORT_FIELD_MAP = {
  id: 'id',
  goodsReceiptId: 'goods_receipt_id',
  lineNumber: 'line_number',
  purchaseOrderLineId: 'purchase_order_line_id',
  productId: 'product_id',
  productSku: 'product_sku',
  productName: 'product_name',
  receivedQuantity: 'received_quantity',
  unitCode: 'unit_code',
  unitLabel: 'unit_label',
  storageLocationId: 'storage_location_id',
  storageLocationCode: 'storage_location_code',
  storageLocationName: 'storage_location_name',
  inventoryMovementId: 'inventory_movement_id',
  inventoryMovementNumber: 'inventory_movement_number',
  notes: 'notes'
} satisfies Record<keyof GoodsReceiptLine, string>;

const RECEIVING_PROGRESS_SORT_FIELD_MAP = {
  purchaseOrderLineId: 'purchase_order_line_id',
  purchaseOrderId: 'purchase_order_id',
  productId: 'product_id',
  productSku: 'product_sku',
  productName: 'product_name',
  orderedQuantity: 'ordered_quantity',
  receivedQuantity: 'received_quantity',
  remainingQuantity: 'remaining_quantity',
  unitLookupValueId: 'unit_lookup_value_id',
  unitCode: 'unit_code',
  unitLabel: 'unit_label'
} satisfies Record<keyof PurchaseOrderLineReceivingProgress, string>;

export function buildGoodsReceiptListRequest(query?: GoodsReceiptQuery): PostgrestListRequest {
  const page = Math.max(0, query?.page ?? 0);
  const pageSize = Math.max(1, query?.pageSize ?? 20);
  const start = page * pageSize;
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: GOODS_RECEIPT_SELECT_COLUMNS,
    order: buildGoodsReceiptOrderParam(query)
  };

  if (query?.purchaseOrderId) {
    params['purchase_order_id'] = `eq.${query.purchaseOrderId}`;
  }

  if (query?.supplierId) {
    params['supplier_id'] = `eq.${query.supplierId}`;
  }

  if (query?.warehouseId) {
    params['warehouse_id'] = `eq.${query.warehouseId}`;
  }

  if (query?.statusCode) {
    params['status_code'] = `eq.${query.statusCode}`;
  }

  const search = normalizeSearchTerm(query?.search);

  if (search) {
    params['or'] = [
      `receipt_number.ilike.*${search}*`,
      `purchase_order_number.ilike.*${search}*`,
      `supplier_code.ilike.*${search}*`,
      `supplier_name.ilike.*${search}*`,
      `warehouse_name.ilike.*${search}*`
    ].join(',');
  }

  return {
    params,
    range: `${start}-${start + pageSize - 1}`,
    page,
    pageSize
  };
}

export function buildGoodsReceiptIdParams(
  id: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  assertUuid(id, 'Goods receipt id must be a valid UUID.');

  return {
    select: GOODS_RECEIPT_SELECT_COLUMNS,
    id: `eq.${id}`
  };
}

export function buildGoodsReceiptLineParams(
  goodsReceiptId: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  assertUuid(goodsReceiptId, 'Goods receipt id must be a valid UUID.');

  return {
    select: GOODS_RECEIPT_LINE_SELECT_COLUMNS,
    goods_receipt_id: `eq.${goodsReceiptId}`,
    order: `${GOODS_RECEIPT_LINE_SORT_FIELD_MAP.lineNumber}.asc`
  };
}

export function buildPurchaseOrderReceivingProgressParams(
  purchaseOrderId: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  assertUuid(purchaseOrderId, 'Purchase order id must be a valid UUID.');

  return {
    select: PURCHASE_ORDER_RECEIVING_PROGRESS_SELECT_COLUMNS,
    purchase_order_id: `eq.${purchaseOrderId}`,
    order: `${RECEIVING_PROGRESS_SORT_FIELD_MAP.productName}.asc`
  };
}

export function buildGoodsReceiptOrderParam(query?: GoodsReceiptQuery): string {
  const field = query?.sortField ? GOODS_RECEIPT_SORT_FIELD_MAP[query.sortField] : 'receipt_date';
  const direction = query?.sortDirection ?? 'desc';
  return `${field}.${direction},id.desc`;
}

export function escapePostgrestIlikeTerm(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/%/g, '\\%')
    .replace(/,/g, '\\,')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function normalizeSearchTerm(value: string | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? escapePostgrestIlikeTerm(normalized) : null;
}

function assertUuid(value: string, message: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(message);
  }
}
