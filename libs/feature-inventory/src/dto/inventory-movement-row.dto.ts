import type { InventoryMovementType } from '../models/inventory-movement-type.model';

export interface InventoryMovementRowDto {
  readonly id: string;
  readonly movement_number: string;
  readonly movement_type: InventoryMovementType;
  readonly product_id: string;
  readonly product_sku: string;
  readonly product_name: string;
  readonly from_warehouse_id: string | null;
  readonly from_warehouse_name: string | null;
  readonly from_storage_location_id: string | null;
  readonly from_storage_location_name: string | null;
  readonly to_warehouse_id: string | null;
  readonly to_warehouse_name: string | null;
  readonly to_storage_location_id: string | null;
  readonly to_storage_location_name: string | null;
  readonly quantity: number | string;
  readonly unit_lookup_value_id: string;
  readonly unit_label: string | null;
  readonly reason: string | null;
  readonly reference_type: string | null;
  readonly reference_id: string | null;
  readonly occurred_at: string;
  readonly created_by_email: string | null;
}

export interface InventoryMovementRpcDto {
  readonly id: string;
  readonly movementNumber: string;
  readonly movementType: InventoryMovementType;
  readonly productId: string;
  readonly productSku: string;
  readonly productName: string;
  readonly fromWarehouseId: string | null;
  readonly fromWarehouseName: string | null;
  readonly fromStorageLocationId: string | null;
  readonly fromStorageLocationName: string | null;
  readonly toWarehouseId: string | null;
  readonly toWarehouseName: string | null;
  readonly toStorageLocationId: string | null;
  readonly toStorageLocationName: string | null;
  readonly quantity: number | string;
  readonly unitLookupValueId: string;
  readonly unitLabel: string | null;
  readonly reason: string | null;
  readonly referenceType: string | null;
  readonly referenceId: string | null;
  readonly occurredAt: string;
  readonly createdByEmail: string | null;
}

export interface InventoryTransferResponseDto {
  readonly outMovement: InventoryMovementRpcDto;
  readonly inMovement: InventoryMovementRpcDto;
}
