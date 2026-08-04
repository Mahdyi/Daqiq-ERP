import type { ApiRequestParamValue } from '@daqiq/core';

import type { SalesDeliveryLine } from '../models/sales-delivery-line.model';
import type { SalesDeliveryQuery } from '../models/sales-delivery-query.model';
import type { SalesDelivery } from '../models/sales-delivery.model';

export interface PostgrestDeliveryListRequest {
  readonly params: Readonly<Record<string, ApiRequestParamValue | undefined>>;
  readonly range: string;
  readonly page: number;
  readonly pageSize: number;
}

export const SALES_DELIVERY_SELECT_COLUMNS =
  'id,delivery_number,sales_order_id,sales_order_number,customer_id,customer_code,customer_name,status_lookup_value_id,status_code,status_label,delivery_date,warehouse_id,warehouse_code,warehouse_name,notes,posted_by_email,posted_at,cancelled_by_email,cancelled_at,created_by_email,created_at,updated_at';

export const SALES_DELIVERY_LINE_SELECT_COLUMNS =
  'id,sales_delivery_id,line_number,sales_order_line_id,product_id,product_sku,product_name,shipped_quantity,unit_code,unit_label,storage_location_id,storage_location_code,storage_location_name,inventory_movement_id,notes';

export const SALES_ORDER_DELIVERY_PROGRESS_SELECT_COLUMNS =
  'sales_order_line_id,sales_order_id,product_id,product_sku,product_name,ordered_quantity,shipped_quantity,remaining_quantity,unit_lookup_value_id,unit_code,unit_label';

const DELIVERY_SORT_FIELD_MAP = {
  id: 'id',
  deliveryNumber: 'delivery_number',
  salesOrderId: 'sales_order_id',
  salesOrderNumber: 'sales_order_number',
  customerId: 'customer_id',
  customerCode: 'customer_code',
  customerName: 'customer_name',
  statusCode: 'status_code',
  statusLabel: 'status_label',
  deliveryDate: 'delivery_date',
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
} satisfies Record<keyof SalesDelivery, string>;

const DELIVERY_LINE_SORT_FIELD_MAP = {
  id: 'id',
  salesDeliveryId: 'sales_delivery_id',
  lineNumber: 'line_number',
  salesOrderLineId: 'sales_order_line_id',
  productId: 'product_id',
  productSku: 'product_sku',
  productName: 'product_name',
  shippedQuantity: 'shipped_quantity',
  unitCode: 'unit_code',
  unitLabel: 'unit_label',
  storageLocationId: 'storage_location_id',
  storageLocationCode: 'storage_location_code',
  storageLocationName: 'storage_location_name',
  inventoryMovementId: 'inventory_movement_id',
  notes: 'notes'
} satisfies Record<keyof SalesDeliveryLine, string>;

export function buildSalesDeliveryListRequest(
  query?: SalesDeliveryQuery
): PostgrestDeliveryListRequest {
  const page = Math.max(0, query?.page ?? 0);
  const pageSize = Math.max(1, query?.pageSize ?? 20);
  const start = page * pageSize;
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: SALES_DELIVERY_SELECT_COLUMNS,
    order: buildSalesDeliveryOrderParam(query)
  };

  if (query?.salesOrderId) {
    params['sales_order_id'] = `eq.${query.salesOrderId}`;
  }

  if (query?.customerId) {
    params['customer_id'] = `eq.${query.customerId}`;
  }

  if (query?.warehouseId) {
    params['warehouse_id'] = `eq.${query.warehouseId}`;
  }

  if (query?.statusCode) {
    params['status_code'] = `eq.${query.statusCode}`;
  }

  if (query?.deliveryDateFrom) {
    params['delivery_date'] = `gte.${query.deliveryDateFrom}`;
  }

  if (query?.deliveryDateTo) {
    params['delivery_date'] = params['delivery_date']
      ? [`${params['delivery_date']}`, `lte.${query.deliveryDateTo}`]
      : `lte.${query.deliveryDateTo}`;
  }

  const search = normalizeSearchTerm(query?.search);

  if (search) {
    params['or'] = [
      `delivery_number.ilike.*${search}*`,
      `sales_order_number.ilike.*${search}*`,
      `customer_code.ilike.*${search}*`,
      `customer_name.ilike.*${search}*`,
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

export function buildSalesDeliveryIdParams(
  id: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  assertUuid(id, 'Sales delivery id must be a valid UUID.');

  return {
    select: SALES_DELIVERY_SELECT_COLUMNS,
    id: `eq.${id}`
  };
}

export function buildSalesDeliveryLineParams(
  salesDeliveryId: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  assertUuid(salesDeliveryId, 'Sales delivery id must be a valid UUID.');

  return {
    select: SALES_DELIVERY_LINE_SELECT_COLUMNS,
    sales_delivery_id: `eq.${salesDeliveryId}`,
    order: `${DELIVERY_LINE_SORT_FIELD_MAP.lineNumber}.asc`
  };
}

export function buildSalesOrderDeliveryProgressParams(
  salesOrderId: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  assertUuid(salesOrderId, 'Sales order id must be a valid UUID.');

  return {
    select: SALES_ORDER_DELIVERY_PROGRESS_SELECT_COLUMNS,
    sales_order_id: `eq.${salesOrderId}`,
    order: 'product_name.asc'
  };
}

function buildSalesDeliveryOrderParam(query?: SalesDeliveryQuery): string {
  const field = query?.sortField ? DELIVERY_SORT_FIELD_MAP[query.sortField] : 'delivery_date';
  const direction = query?.sortDirection ?? 'desc';
  return `${field}.${direction},id.desc`;
}

function normalizeSearchTerm(value: string | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? escapePostgrestIlikeTerm(normalized) : null;
}

function escapePostgrestIlikeTerm(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/%/g, '\\%')
    .replace(/,/g, '\\,')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function assertUuid(value: string, message: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value)) {
    throw new Error(message);
  }
}
