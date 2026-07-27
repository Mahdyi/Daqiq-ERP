import { ApiError } from '@daqiq/core';

import type { ProductPostgrestRow } from '../dto/product-postgrest-row.dto';
import type { Product } from '../models/product.model';

export function mapProductPostgrestRow(row: ProductPostgrestRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    barcode: row.barcode,
    productType: row.product_type,
    categoryLookupValueId: row.category_lookup_value_id,
    baseUnitLookupValueId: row.base_unit_lookup_value_id,
    taxRateLookupValueId: row.tax_rate_lookup_value_id,
    trackInventory: row.track_inventory,
    purchasable: row.purchasable,
    sellable: row.sellable,
    standardCost: parseNullableNumber(row.standard_cost, 'standard_cost'),
    salesPrice: parseNullableNumber(row.sales_price, 'sales_price'),
    active: row.active,
    createdAt: parseDate(row.created_at, 'created_at'),
    updatedAt: parseDate(row.updated_at, 'updated_at')
  };
}

function parseNullableNumber(value: number | string | null, field: string): number | null {
  if (value === null) {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    throw new ApiError({
      status: 0,
      code: 'UNKNOWN',
      message: `Invalid numeric value for ${field}.`,
      fieldErrors: []
    });
  }

  return parsed;
}

function parseDate(value: string, field: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError({
      status: 0,
      code: 'UNKNOWN',
      message: `Invalid date value for ${field}.`,
      fieldErrors: []
    });
  }

  return date;
}
