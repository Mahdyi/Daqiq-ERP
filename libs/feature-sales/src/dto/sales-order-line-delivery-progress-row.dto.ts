export interface SalesOrderLineDeliveryProgressRowDto {
  readonly sales_order_line_id: string;
  readonly sales_order_id: string;
  readonly product_id: string;
  readonly product_sku: string;
  readonly product_name: string;
  readonly ordered_quantity: number;
  readonly shipped_quantity: number;
  readonly remaining_quantity: number;
  readonly unit_lookup_value_id: string;
  readonly unit_code: string;
  readonly unit_label: string | null;
}
