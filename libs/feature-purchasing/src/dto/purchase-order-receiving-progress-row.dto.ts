export interface PurchaseOrderLineReceivingProgressRowDto {
  readonly purchase_order_line_id: string;
  readonly purchase_order_id: string;
  readonly product_id: string;
  readonly product_sku: string;
  readonly product_name: string;
  readonly ordered_quantity: string | number;
  readonly received_quantity: string | number;
  readonly remaining_quantity: string | number;
  readonly unit_lookup_value_id: string;
  readonly unit_code: string;
  readonly unit_label: string | null;
}
