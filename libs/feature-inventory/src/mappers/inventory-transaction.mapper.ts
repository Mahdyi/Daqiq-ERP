import type {
  InventoryAdjustInRequestDto
} from '../dto/inventory-adjust-in-request.dto';
import type {
  InventoryAdjustOutRequestDto
} from '../dto/inventory-adjust-out-request.dto';
import type { InventoryTransferRequestDto } from '../dto/inventory-transfer-request.dto';
import type {
  InventoryAdjustmentFormValue,
  InventoryTransferFormValue
} from '../models/inventory-transaction-form-value.model';

export const DEFAULT_ADJUSTMENT_FORM_VALUE: InventoryAdjustmentFormValue = {
  movementDirection: 'in',
  productId: null,
  warehouseId: null,
  storageLocationId: null,
  quantity: null,
  reason: null
};

export const DEFAULT_TRANSFER_FORM_VALUE: InventoryTransferFormValue = {
  productId: null,
  fromWarehouseId: null,
  fromStorageLocationId: null,
  toWarehouseId: null,
  toStorageLocationId: null,
  quantity: null,
  reason: null
};

export function mapAdjustmentToInRequest(
  value: Readonly<InventoryAdjustmentFormValue>
): InventoryAdjustInRequestDto {
  return {
    product_id: requiredText(value.productId),
    warehouse_id: requiredText(value.warehouseId),
    storage_location_id: optionalText(value.storageLocationId),
    quantity: requiredPositiveNumber(value.quantity),
    reason: requiredText(value.reason)
  };
}

export function mapAdjustmentToOutRequest(
  value: Readonly<InventoryAdjustmentFormValue>
): InventoryAdjustOutRequestDto {
  return {
    product_id: requiredText(value.productId),
    warehouse_id: requiredText(value.warehouseId),
    storage_location_id: optionalText(value.storageLocationId),
    quantity: requiredPositiveNumber(value.quantity),
    reason: requiredText(value.reason)
  };
}

export function mapTransferToRequest(
  value: Readonly<InventoryTransferFormValue>
): InventoryTransferRequestDto {
  return {
    product_id: requiredText(value.productId),
    from_warehouse_id: requiredText(value.fromWarehouseId),
    from_storage_location_id: optionalText(value.fromStorageLocationId),
    to_warehouse_id: requiredText(value.toWarehouseId),
    to_storage_location_id: optionalText(value.toStorageLocationId),
    quantity: requiredPositiveNumber(value.quantity),
    reason: optionalText(value.reason)
  };
}

export function transferSourceMatchesDestination(
  value: Readonly<InventoryTransferFormValue>
): boolean {
  return (
    value.fromWarehouseId !== null &&
    value.fromWarehouseId === value.toWarehouseId &&
    (value.fromStorageLocationId ?? null) === (value.toStorageLocationId ?? null)
  );
}

function requiredText(value: string | null): string {
  return (value ?? '').trim();
}

function optionalText(value: string | null): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}

function requiredPositiveNumber(value: number | null): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
