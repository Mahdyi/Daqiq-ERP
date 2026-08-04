export interface InventoryBalance {
  readonly id: string;
  readonly productId: string;
  readonly productSku: string;
  readonly productName: string;
  readonly warehouseId: string;
  readonly warehouseCode: string;
  readonly warehouseName: string;
  readonly storageLocationId: string | null;
  readonly storageLocationCode: string | null;
  readonly storageLocationName: string | null;
  readonly quantityOnHand: number;
  readonly unitLookupValueId: string;
  readonly unitLabel: string | null;
  readonly updatedAt: Date;
}
