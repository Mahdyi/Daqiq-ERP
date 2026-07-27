import type { ApiRequestParamValue } from '@daqiq/core';

import type { Product } from '../models/product.model';
import type { ProductQuery } from '../models/product-query.model';

export const PRODUCT_SELECT_COLUMNS =
  'id,sku,name,description,barcode,product_type,category_lookup_value_id,base_unit_lookup_value_id,tax_rate_lookup_value_id,track_inventory,purchasable,sellable,standard_cost,sales_price,active,created_at,updated_at';

const SORT_FIELD_MAP = {
  id: 'id',
  sku: 'sku',
  name: 'name',
  description: 'description',
  barcode: 'barcode',
  productType: 'product_type',
  categoryLookupValueId: 'category_lookup_value_id',
  baseUnitLookupValueId: 'base_unit_lookup_value_id',
  taxRateLookupValueId: 'tax_rate_lookup_value_id',
  trackInventory: 'track_inventory',
  purchasable: 'purchasable',
  sellable: 'sellable',
  standardCost: 'standard_cost',
  salesPrice: 'sales_price',
  active: 'active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
} satisfies Record<keyof Product, string>;

export interface PostgrestProductListRequest {
  readonly params: Readonly<Record<string, ApiRequestParamValue | undefined>>;
  readonly range: string;
  readonly page: number;
  readonly pageSize: number;
}

export function buildPostgrestProductListRequest(
  query?: ProductQuery
): PostgrestProductListRequest {
  const page = Math.max(0, query?.page ?? 0);
  const pageSize = Math.max(1, query?.pageSize ?? 20);
  const start = page * pageSize;
  const end = start + pageSize - 1;
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: PRODUCT_SELECT_COLUMNS,
    order: buildOrderParam(query)
  };

  if (query?.active !== undefined) {
    params['active'] = `eq.${query.active}`;
  }

  if (query?.productType) {
    params['product_type'] = `eq.${query.productType}`;
  }

  if (query?.categoryLookupValueId) {
    params['category_lookup_value_id'] = `eq.${query.categoryLookupValueId}`;
  }

  const search = normalizeSearchTerm(query?.search);

  if (search) {
    params['or'] = buildSearchParam(search);
  }

  return {
    params,
    range: `${start}-${end}`,
    page,
    pageSize
  };
}

export function buildPostgrestProductIdParams(
  id: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  if (!isUuid(id)) {
    throw new Error('Product id must be a valid UUID.');
  }

  return {
    select: PRODUCT_SELECT_COLUMNS,
    id: `eq.${id}`
  };
}

export function buildOrderParam(query?: ProductQuery): string {
  const field = query?.sortField ? SORT_FIELD_MAP[query.sortField] : 'created_at';
  const direction = query?.sortDirection ?? 'desc';

  return `${field}.${direction},id.asc`;
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

function buildSearchParam(search: string): string {
  return [
    `sku.ilike.*${search}*`,
    `name.ilike.*${search}*`,
    `barcode.ilike.*${search}*`,
    `description.ilike.*${search}*`
  ].join(',');
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
