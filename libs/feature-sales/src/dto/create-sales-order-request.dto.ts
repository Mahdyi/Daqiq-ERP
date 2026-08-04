export interface SalesOrderLineRequestDto {
  readonly product_id: string;
  readonly description?: string | null;
  readonly quantity: number;
  readonly unit_lookup_value_id: string;
  readonly unit_price: number;
  readonly tax_rate_lookup_value_id?: string | null;
}

export interface CreateSalesOrderRequestDto {
  readonly customer_id: string;
  readonly order_date: string;
  readonly requested_delivery_date?: string | null;
  readonly currency_lookup_value_id?: string | null;
  readonly delivery_warehouse_id?: string | null;
  readonly notes?: string | null;
  readonly lines: readonly SalesOrderLineRequestDto[];
}

