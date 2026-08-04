import type { ApiQuery, ApiRequestParamValue } from '@daqiq/core';

import type { InventoryBalance } from '../models/inventory-balance.model';
import type { InventoryMovement } from '../models/inventory-movement.model';
import type {
  InventoryBalanceQuery,
  InventoryMovementQuery
} from '../models/inventory-query.model';

export interface PostgrestListRequest {
  readonly params: Readonly<Record<string, ApiRequestParamValue | undefined>>;
  readonly range: string;
  readonly page: number;
  readonly pageSize: number;
}

export const INVENTORY_BALANCE_SELECT_COLUMNS =
  'id,product_id,product_sku,product_name,warehouse_id,warehouse_code,warehouse_name,storage_location_id,storage_location_code,storage_location_name,quantity_on_hand,unit_lookup_value_id,unit_code,unit_label,updated_at';

export const INVENTORY_MOVEMENT_SELECT_COLUMNS =
  'id,movement_number,movement_type,product_id,product_sku,product_name,from_warehouse_id,from_warehouse_name,from_storage_location_id,from_storage_location_name,to_warehouse_id,to_warehouse_name,to_storage_location_id,to_storage_location_name,quantity,unit_lookup_value_id,unit_label,reason,reference_type,reference_id,occurred_at,created_by_email';

const BALANCE_SORT_FIELD_MAP = {
  id: 'id',
  productId: 'product_id',
  productSku: 'product_sku',
  productName: 'product_name',
  warehouseId: 'warehouse_id',
  warehouseCode: 'warehouse_code',
  warehouseName: 'warehouse_name',
  storageLocationId: 'storage_location_id',
  storageLocationCode: 'storage_location_code',
  storageLocationName: 'storage_location_name',
  quantityOnHand: 'quantity_on_hand',
  unitLookupValueId: 'unit_lookup_value_id',
  unitLabel: 'unit_label',
  updatedAt: 'updated_at'
} satisfies Record<keyof InventoryBalance, string>;

const MOVEMENT_SORT_FIELD_MAP = {
  id: 'id',
  movementNumber: 'movement_number',
  movementType: 'movement_type',
  productId: 'product_id',
  productSku: 'product_sku',
  productName: 'product_name',
  fromWarehouseId: 'from_warehouse_id',
  fromWarehouseName: 'from_warehouse_name',
  fromStorageLocationId: 'from_storage_location_id',
  fromStorageLocationName: 'from_storage_location_name',
  toWarehouseId: 'to_warehouse_id',
  toWarehouseName: 'to_warehouse_name',
  toStorageLocationId: 'to_storage_location_id',
  toStorageLocationName: 'to_storage_location_name',
  quantity: 'quantity',
  unitLookupValueId: 'unit_lookup_value_id',
  unitLabel: 'unit_label',
  reason: 'reason',
  referenceType: 'reference_type',
  referenceId: 'reference_id',
  occurredAt: 'occurred_at',
  createdByEmail: 'created_by_email'
} satisfies Record<keyof InventoryMovement, string>;

export function buildInventoryBalanceListRequest(
  query?: InventoryBalanceQuery
): PostgrestListRequest {
  const range = buildRange(query);
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: INVENTORY_BALANCE_SELECT_COLUMNS,
    order: buildInventoryBalanceOrderParam(query)
  };

  if (query?.productId) {
    params['product_id'] = `eq.${query.productId}`;
  }
  if (query?.warehouseId) {
    params['warehouse_id'] = `eq.${query.warehouseId}`;
  }
  if (query?.storageLocationId) {
    params['storage_location_id'] = `eq.${query.storageLocationId}`;
  }
  if (query?.nonZeroOnly === true) {
    params['quantity_on_hand'] = 'neq.0';
  }

  const search = normalizeSearchTerm(query?.search);
  if (search) {
    params['or'] = [
      `product_sku.ilike.*${search}*`,
      `product_name.ilike.*${search}*`,
      `warehouse_code.ilike.*${search}*`,
      `warehouse_name.ilike.*${search}*`,
      `storage_location_code.ilike.*${search}*`,
      `storage_location_name.ilike.*${search}*`
    ].join(',');
  }

  return { ...range, params };
}

export function buildInventoryMovementListRequest(
  query?: InventoryMovementQuery
): PostgrestListRequest {
  const range = buildRange(query);
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: INVENTORY_MOVEMENT_SELECT_COLUMNS,
    order: buildInventoryMovementOrderParam(query)
  };

  if (query?.productId) {
    params['product_id'] = `eq.${query.productId}`;
  }
  if (query?.warehouseId) {
    params['or'] = [
      `from_warehouse_id.eq.${query.warehouseId}`,
      `to_warehouse_id.eq.${query.warehouseId}`
    ].join(',');
  }
  if (query?.movementType) {
    params['movement_type'] = `eq.${query.movementType}`;
  }

  const search = normalizeSearchTerm(query?.search);
  if (search) {
    const existingOr = params['or'];
    const searchOr = [
      `movement_number.ilike.*${search}*`,
      `product_sku.ilike.*${search}*`,
      `product_name.ilike.*${search}*`,
      `from_warehouse_name.ilike.*${search}*`,
      `to_warehouse_name.ilike.*${search}*`,
      `reason.ilike.*${search}*`,
      `created_by_email.ilike.*${search}*`
    ].join(',');
    params['or'] = existingOr ? `${existingOr},${searchOr}` : searchOr;
  }

  return { ...range, params };
}

export function buildInventoryBalanceOrderParam(query?: InventoryBalanceQuery): string {
  const field = query?.sortField ? BALANCE_SORT_FIELD_MAP[query.sortField] : 'updated_at';
  const direction = query?.sortDirection ?? 'desc';
  return `${field}.${direction},id.asc`;
}

export function buildInventoryMovementOrderParam(query?: InventoryMovementQuery): string {
  const field = query?.sortField ? MOVEMENT_SORT_FIELD_MAP[query.sortField] : 'occurred_at';
  const direction = query?.sortDirection ?? 'desc';
  return `${field}.${direction},id.desc`;
}

export function buildRange(query?: ApiQuery): Pick<PostgrestListRequest, 'range' | 'page' | 'pageSize'> {
  const page = Math.max(0, query?.page ?? 0);
  const pageSize = Math.max(1, query?.pageSize ?? 20);
  const start = page * pageSize;
  return {
    page,
    pageSize,
    range: `${start}-${start + pageSize - 1}`
  };
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
