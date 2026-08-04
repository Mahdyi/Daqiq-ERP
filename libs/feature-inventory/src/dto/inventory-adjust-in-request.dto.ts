export interface InventoryAdjustInRequestDto {
  readonly product_id: string;
  readonly warehouse_id: string;
  readonly storage_location_id: string | null;
  readonly quantity: number;
  readonly reason: string;
}
