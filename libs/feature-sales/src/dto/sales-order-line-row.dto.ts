export interface SalesOrderLineRowDto {
  readonly id: string;
  readonly sales_order_id: string;
  readonly line_number: number;
  readonly product_id: string;
  readonly product_sku: string;
  readonly product_name: string;
  readonly description: string | null;
  readonly quantity: string | number;
  readonly unit_lookup_value_id: string;
  readonly unit_code: string;
  readonly unit_label: string;
  readonly unit_price: string | number;
  readonly tax_rate_lookup_value_id: string | null;
  readonly tax_rate_code: string | null;
  readonly tax_rate_label: string | null;
  readonly tax_amount: string | number;
  readonly line_total: string | number;
}

