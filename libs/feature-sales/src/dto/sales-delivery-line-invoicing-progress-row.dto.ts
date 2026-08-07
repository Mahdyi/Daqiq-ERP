export interface SalesDeliveryLineInvoicingProgressRowDto {
  readonly sales_delivery_line_id: string;
  readonly sales_delivery_id: string;
  readonly sales_order_line_id: string;
  readonly product_id: string;
  readonly product_sku: string;
  readonly product_name: string;
  readonly delivered_quantity: number;
  readonly invoiced_quantity: number;
  readonly remaining_quantity: number;
  readonly unit_lookup_value_id: string;
  readonly unit_code: string;
  readonly unit_label: string | null;
}
