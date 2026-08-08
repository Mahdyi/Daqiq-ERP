import type { SupplierInvoiceStatus } from '../models/supplier-invoice-status.model';

export interface SupplierInvoiceRowDto {
  readonly id: string;
  readonly invoice_number: string;
  readonly supplier_invoice_number: string | null;
  readonly supplier_id: string;
  readonly supplier_code: string;
  readonly supplier_name: string;
  readonly purchase_order_id: string | null;
  readonly purchase_order_number: string | null;
  readonly goods_receipt_id: string | null;
  readonly goods_receipt_number: string | null;
  readonly status_lookup_value_id: string;
  readonly status_code: SupplierInvoiceStatus;
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
  readonly posted_by_email: string | null;
  readonly posted_at: string | null;
  readonly cancelled_by_email: string | null;
  readonly cancelled_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}
