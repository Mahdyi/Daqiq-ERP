import type { InventoryMovementType } from './inventory-movement-type.model';

export interface InventoryMovement {
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
  readonly quantity: number;
  readonly unitLookupValueId: string;
  readonly unitLabel: string | null;
  readonly reason: string | null;
  readonly referenceType: string | null;
  readonly referenceId: string | null;
  readonly occurredAt: Date;
  readonly createdByEmail: string | null;
}
