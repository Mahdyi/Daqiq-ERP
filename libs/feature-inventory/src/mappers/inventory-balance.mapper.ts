import type { InventoryBalanceRowDto } from '../dto/inventory-balance-row.dto';
import type { InventoryBalance } from '../models/inventory-balance.model';

export function mapInventoryBalanceRow(dto: InventoryBalanceRowDto): InventoryBalance {
  return {
    id: dto.id,
    productId: dto.product_id,
    productSku: dto.product_sku,
    productName: dto.product_name,
    warehouseId: dto.warehouse_id,
    warehouseCode: dto.warehouse_code,
    warehouseName: dto.warehouse_name,
    storageLocationId: dto.storage_location_id,
    storageLocationCode: dto.storage_location_code,
    storageLocationName: dto.storage_location_name,
    quantityOnHand: parseNumeric(dto.quantity_on_hand),
    unitLookupValueId: dto.unit_lookup_value_id,
    unitLabel: dto.unit_label,
    updatedAt: parseDate(dto.updated_at)
  };
}

export function parseNumeric(value: number | string): number {
  const normalized = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(normalized)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  return normalized;
}

export function parseDate(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return date;
}
