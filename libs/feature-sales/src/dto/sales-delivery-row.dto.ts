import type { SalesDeliveryStatus } from '../models/sales-delivery-status.model';

export interface SalesDeliveryRowDto {
  readonly id: string;
  readonly delivery_number: string;
  readonly sales_order_id: string;
  readonly sales_order_number: string;
  readonly customer_id: string;
  readonly customer_code: string;
  readonly customer_name: string;
  readonly status_lookup_value_id: string;
  readonly status_code: SalesDeliveryStatus;
  readonly status_label: string;
  readonly delivery_date: string;
  readonly warehouse_id: string;
  readonly warehouse_code: string;
  readonly warehouse_name: string;
  readonly notes: string | null;
  readonly posted_by_email: string | null;
  readonly posted_at: string | null;
  readonly cancelled_by_email: string | null;
  readonly cancelled_at: string | null;
  readonly created_by_email: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}
