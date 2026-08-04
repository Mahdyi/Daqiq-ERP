import type {
  InventoryMovementRowDto,
  InventoryMovementRpcDto
} from '../dto/inventory-movement-row.dto';
import type { InventoryMovement } from '../models/inventory-movement.model';
import { parseDate, parseNumeric } from './inventory-balance.mapper';

export function mapInventoryMovementRow(dto: InventoryMovementRowDto): InventoryMovement {
  return {
    id: dto.id,
    movementNumber: dto.movement_number,
    movementType: dto.movement_type,
    productId: dto.product_id,
    productSku: dto.product_sku,
    productName: dto.product_name,
    fromWarehouseId: dto.from_warehouse_id,
    fromWarehouseName: dto.from_warehouse_name,
    fromStorageLocationId: dto.from_storage_location_id,
    fromStorageLocationName: dto.from_storage_location_name,
    toWarehouseId: dto.to_warehouse_id,
    toWarehouseName: dto.to_warehouse_name,
    toStorageLocationId: dto.to_storage_location_id,
    toStorageLocationName: dto.to_storage_location_name,
    quantity: parseNumeric(dto.quantity),
    unitLookupValueId: dto.unit_lookup_value_id,
    unitLabel: dto.unit_label,
    reason: dto.reason,
    referenceType: dto.reference_type,
    referenceId: dto.reference_id,
    occurredAt: parseDate(dto.occurred_at),
    createdByEmail: dto.created_by_email
  };
}

export function mapInventoryMovementRpc(dto: InventoryMovementRpcDto): InventoryMovement {
  return {
    id: dto.id,
    movementNumber: dto.movementNumber,
    movementType: dto.movementType,
    productId: dto.productId,
    productSku: dto.productSku,
    productName: dto.productName,
    fromWarehouseId: dto.fromWarehouseId,
    fromWarehouseName: dto.fromWarehouseName,
    fromStorageLocationId: dto.fromStorageLocationId,
    fromStorageLocationName: dto.fromStorageLocationName,
    toWarehouseId: dto.toWarehouseId,
    toWarehouseName: dto.toWarehouseName,
    toStorageLocationId: dto.toStorageLocationId,
    toStorageLocationName: dto.toStorageLocationName,
    quantity: parseNumeric(dto.quantity),
    unitLookupValueId: dto.unitLookupValueId,
    unitLabel: dto.unitLabel,
    reason: dto.reason,
    referenceType: dto.referenceType,
    referenceId: dto.referenceId,
    occurredAt: parseDate(dto.occurredAt),
    createdByEmail: dto.createdByEmail
  };
}

export function inventoryMovementTypeLabel(type: InventoryMovement['movementType']): string {
  switch (type) {
    case 'adjustment_in':
      return 'افزایش اصلاحی';
    case 'adjustment_out':
      return 'کاهش اصلاحی';
    case 'transfer_out':
      return 'خروج انتقالی';
    case 'transfer_in':
      return 'ورود انتقالی';
    case 'opening_balance':
      return 'موجودی اول دوره';
  }
}
