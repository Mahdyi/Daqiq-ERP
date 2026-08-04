export interface InventoryBalanceRowDto {
  readonly id: string;
  readonly product_id: string;
  readonly product_sku: string;
  readonly product_name: string;
  readonly warehouse_id: string;
  readonly warehouse_code: string;
  readonly warehouse_name: string;
  readonly storage_location_id: string | null;
  readonly storage_location_code: string | null;
  readonly storage_location_name: string | null;
  readonly quantity_on_hand: number | string;
  readonly unit_lookup_value_id: string;
  readonly unit_code: string | null;
  readonly unit_label: string | null;
  readonly updated_at: string;
}
