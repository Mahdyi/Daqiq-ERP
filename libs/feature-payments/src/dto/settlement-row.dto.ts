export interface SalesInvoiceSettlementRowDto {
  readonly sales_invoice_id: string;
  readonly invoice_number: string;
  readonly customer_id: string;
  readonly customer_code: string;
  readonly customer_name: string;
  readonly invoice_date: string;
  readonly due_date: string | null;
  readonly total_amount: string | number;
  readonly paid_amount: string | number;
  readonly remaining_amount: string | number;
  readonly settlement_status: 'unpaid' | 'partially_paid' | 'paid';
}

export interface SupplierInvoiceSettlementRowDto {
  readonly supplier_invoice_id: string;
  readonly invoice_number: string;
  readonly supplier_invoice_number: string | null;
  readonly supplier_id: string;
  readonly supplier_code: string;
  readonly supplier_name: string;
  readonly invoice_date: string;
  readonly due_date: string | null;
  readonly total_amount: string | number;
  readonly paid_amount: string | number;
  readonly remaining_amount: string | number;
  readonly settlement_status: 'unpaid' | 'partially_paid' | 'paid';
}
