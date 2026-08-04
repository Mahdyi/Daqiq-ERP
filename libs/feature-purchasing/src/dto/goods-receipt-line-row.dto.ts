export interface GoodsReceiptLineRowDto {
  readonly id: string;
  readonly goods_receipt_id: string;
  readonly line_number: number;
  readonly purchase_order_line_id: string;
  readonly product_id: string;
  readonly product_sku: string;
  readonly product_name: string;
  readonly received_quantity: string | number;
  readonly unit_code: string;
  readonly unit_label: string | null;
  readonly storage_location_id: string | null;
  readonly storage_location_code: string | null;
  readonly storage_location_name: string | null;
  readonly inventory_movement_id: string | null;
  readonly inventory_movement_number: string | null;
  readonly notes: string | null;
}
