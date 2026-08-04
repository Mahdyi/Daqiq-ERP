import type { SalesOrderLineRequestDto } from './create-sales-order-request.dto';

export interface UpdateSalesOrderRequestDto {
  readonly sales_order_id: string;
  readonly customer_id: string;
  readonly order_date: string;
  readonly requested_delivery_date?: string | null;
  readonly currency_lookup_value_id?: string | null;
  readonly delivery_warehouse_id?: string | null;
  readonly notes?: string | null;
  readonly lines: readonly SalesOrderLineRequestDto[];
}

