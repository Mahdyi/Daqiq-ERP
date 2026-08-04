export interface InventoryProductOptionRowDto {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly active: boolean;
  readonly track_inventory: boolean;
}

export interface InventoryWarehouseOptionRowDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly active: boolean;
}

export interface InventoryStorageLocationOptionRowDto {
  readonly id: string;
  readonly warehouse_id: string;
  readonly code: string;
  readonly name: string;
  readonly active: boolean;
}
