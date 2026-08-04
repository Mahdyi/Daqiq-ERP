import type { SalesOrderStatus } from '../models/sales-order-status.model';

export interface SalesOrderRowDto {
  readonly id: string;
  readonly order_number: string;
  readonly customer_id: string;
  readonly customer_code: string;
  readonly customer_name: string;
  readonly status_lookup_value_id: string;
  readonly status_code: SalesOrderStatus;
  readonly status_label: string;
  readonly order_date: string;
  readonly requested_delivery_date: string | null;
  readonly currency_lookup_value_id: string | null;
  readonly currency_code: string | null;
  readonly currency_label: string | null;
  readonly delivery_warehouse_id: string | null;
  readonly delivery_warehouse_code: string | null;
  readonly delivery_warehouse_name: string | null;
  readonly subtotal_amount: string | number;
  readonly tax_amount: string | number;
  readonly total_amount: string | number;
  readonly created_by_email: string | null;
  readonly confirmed_by_email: string | null;
  readonly confirmed_at: string | null;
  readonly cancelled_by_email: string | null;
  readonly cancelled_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}
