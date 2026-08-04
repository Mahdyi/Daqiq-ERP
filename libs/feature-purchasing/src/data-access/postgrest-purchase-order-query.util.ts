import type { ApiRequestParamValue } from '@daqiq/core';

import type { PurchaseOrderLine } from '../models/purchase-order-line.model';
import type { PurchaseOrderQuery } from '../models/purchase-order-query.model';
import type { PurchaseOrder } from '../models/purchase-order.model';

export interface PostgrestListRequest {
  readonly params: Readonly<Record<string, ApiRequestParamValue | undefined>>;
  readonly range: string;
  readonly page: number;
  readonly pageSize: number;
}

export const PURCHASE_ORDER_SELECT_COLUMNS =
  'id,order_number,supplier_id,supplier_code,supplier_name,status_lookup_value_id,status_code,status_label,order_date,expected_date,currency_lookup_value_id,currency_code,currency_label,delivery_warehouse_id,delivery_warehouse_code,delivery_warehouse_name,subtotal_amount,tax_amount,total_amount,created_by_email,approved_by_email,approved_at,cancelled_by_email,cancelled_at,created_at,updated_at';

export const PURCHASE_ORDER_LINE_SELECT_COLUMNS =
  'id,purchase_order_id,line_number,product_id,product_sku,product_name,description,quantity,unit_lookup_value_id,unit_code,unit_label,unit_price,tax_rate_lookup_value_id,tax_rate_code,tax_rate_label,tax_amount,line_total';

const PURCHASE_ORDER_SORT_FIELD_MAP = {
  id: 'id',
  orderNumber: 'order_number',
  supplierId: 'supplier_id',
  supplierCode: 'supplier_code',
  supplierName: 'supplier_name',
  statusLookupValueId: 'status_lookup_value_id',
  statusCode: 'status_code',
  statusLabel: 'status_label',
  orderDate: 'order_date',
  expectedDate: 'expected_date',
  currencyLookupValueId: 'currency_lookup_value_id',
  currencyCode: 'currency_code',
  currencyLabel: 'currency_label',
  deliveryWarehouseId: 'delivery_warehouse_id',
  deliveryWarehouseCode: 'delivery_warehouse_code',
  deliveryWarehouseName: 'delivery_warehouse_name',
  subtotalAmount: 'subtotal_amount',
  taxAmount: 'tax_amount',
  totalAmount: 'total_amount',
  createdByEmail: 'created_by_email',
  approvedByEmail: 'approved_by_email',
  approvedAt: 'approved_at',
  cancelledByEmail: 'cancelled_by_email',
  cancelledAt: 'cancelled_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
} satisfies Record<keyof PurchaseOrder, string>;

const LINE_SORT_FIELD_MAP = {
  id: 'id',
  purchaseOrderId: 'purchase_order_id',
  lineNumber: 'line_number',
  productId: 'product_id',
  productSku: 'product_sku',
  productName: 'product_name',
  description: 'description',
  quantity: 'quantity',
  unitLookupValueId: 'unit_lookup_value_id',
  unitCode: 'unit_code',
  unitLabel: 'unit_label',
  unitPrice: 'unit_price',
  taxRateLookupValueId: 'tax_rate_lookup_value_id',
  taxRateCode: 'tax_rate_code',
  taxRateLabel: 'tax_rate_label',
  taxAmount: 'tax_amount',
  lineTotal: 'line_total'
} satisfies Record<keyof PurchaseOrderLine, string>;

export function buildPurchaseOrderListRequest(
  query?: PurchaseOrderQuery
): PostgrestListRequest {
  const page = Math.max(0, query?.page ?? 0);
  const pageSize = Math.max(1, query?.pageSize ?? 20);
  const start = page * pageSize;
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: PURCHASE_ORDER_SELECT_COLUMNS,
    order: buildPurchaseOrderOrderParam(query)
  };

  if (query?.supplierId) {
    params['supplier_id'] = `eq.${query.supplierId}`;
  }

  if (query?.statusCode) {
    params['status_code'] = `eq.${query.statusCode}`;
  }

  if (query?.orderDateFrom) {
    params['order_date'] = `gte.${query.orderDateFrom}`;
  }

  if (query?.orderDateTo) {
    params['order_date'] = params['order_date']
      ? [`${params['order_date']}`, `lte.${query.orderDateTo}`]
      : `lte.${query.orderDateTo}`;
  }

  const search = normalizeSearchTerm(query?.search);

  if (search) {
    params['or'] = [
      `order_number.ilike.*${search}*`,
      `supplier_code.ilike.*${search}*`,
      `supplier_name.ilike.*${search}*`,
      `status_label.ilike.*${search}*`
    ].join(',');
  }

  return {
    params,
    range: `${start}-${start + pageSize - 1}`,
    page,
    pageSize
  };
}

export function buildPurchaseOrderIdParams(
  id: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  assertUuid(id, 'Purchase order id must be a valid UUID.');

  return {
    select: PURCHASE_ORDER_SELECT_COLUMNS,
    id: `eq.${id}`
  };
}

export function buildPurchaseOrderLineParams(
  purchaseOrderId: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  assertUuid(purchaseOrderId, 'Purchase order id must be a valid UUID.');

  return {
    select: PURCHASE_ORDER_LINE_SELECT_COLUMNS,
    purchase_order_id: `eq.${purchaseOrderId}`,
    order: `${LINE_SORT_FIELD_MAP.lineNumber}.asc`
  };
}

export function buildPurchaseOrderOrderParam(query?: PurchaseOrderQuery): string {
  const field = query?.sortField ? PURCHASE_ORDER_SORT_FIELD_MAP[query.sortField] : 'order_date';
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
