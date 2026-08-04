import type { InventoryAdjustmentDirection } from './inventory-movement-type.model';

export interface InventoryAdjustmentFormValue {
  readonly movementDirection: InventoryAdjustmentDirection | null;
  readonly productId: string | null;
  readonly warehouseId: string | null;
  readonly storageLocationId: string | null;
  readonly quantity: number | null;
  readonly reason: string | null;
}

export interface InventoryTransferFormValue {
  readonly productId: string | null;
  readonly fromWarehouseId: string | null;
  readonly fromStorageLocationId: string | null;
  readonly toWarehouseId: string | null;
  readonly toStorageLocationId: string | null;
  readonly quantity: number | null;
  readonly reason: string | null;
}

export interface InventoryOption {
  readonly id: string;
  readonly label: string;
}
