export interface InventoryTransferRequestDto {
  readonly product_id: string;
  readonly from_warehouse_id: string;
  readonly from_storage_location_id: string | null;
  readonly to_warehouse_id: string;
  readonly to_storage_location_id: string | null;
  readonly quantity: number;
  readonly reason: string | null;
}
