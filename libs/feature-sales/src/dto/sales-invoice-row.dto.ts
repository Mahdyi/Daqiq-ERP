import type { SalesInvoiceStatus } from '../models/sales-invoice-status.model';

export interface SalesInvoiceRowDto {
  readonly id: string;
  readonly invoice_number: string;
  readonly customer_id: string;
  readonly customer_code: string;
  readonly customer_name: string;
  readonly sales_order_id: string | null;
  readonly sales_order_number: string | null;
  readonly sales_delivery_id: string | null;
  readonly sales_delivery_number: string | null;
  readonly status_lookup_value_id: string;
  readonly status_code: SalesInvoiceStatus;
  readonly status_label: string;
  readonly invoice_date: string;
  readonly due_date: string | null;
  readonly currency_lookup_value_id: string | null;
  readonly currency_code: string | null;
  readonly currency_label: string | null;
  readonly subtotal_amount: number;
  readonly tax_amount: number;
  readonly total_amount: number;
  readonly notes: string | null;
  readonly created_by_email: string | null;
  readonly issued_by_email: string | null;
  readonly issued_at: string | null;
  readonly cancelled_by_email: string | null;
  readonly cancelled_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}
