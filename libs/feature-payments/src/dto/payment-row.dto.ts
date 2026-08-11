export interface CashBankAccountRowDto {
  readonly id: string;
  readonly account_code: string;
  readonly account_name: string;
  readonly account_type_lookup_value_id: string;
  readonly account_type_code: string;
  readonly account_type_label: string;
  readonly currency_lookup_value_id: string | null;
  readonly currency_code: string | null;
  readonly currency_label: string | null;
  readonly gl_account_id: string;
  readonly gl_account_code: string;
  readonly gl_account_name: string;
  readonly bank_name: string | null;
  readonly iban: string | null;
  readonly account_number: string | null;
  readonly description: string | null;
  readonly active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface CustomerReceiptRowDto {
  readonly id: string;
  readonly receipt_number: string;
  readonly customer_id: string;
  readonly customer_code: string;
  readonly customer_name: string;
  readonly cash_bank_account_id: string;
  readonly cash_bank_account_code: string;
  readonly cash_bank_account_name: string;
  readonly status_code: 'draft' | 'posted' | 'cancelled';
  readonly status_label: string;
  readonly payment_method_code: string | null;
  readonly payment_method_label: string | null;
  readonly receipt_date: string;
  readonly currency_code: string | null;
  readonly currency_label: string | null;
  readonly amount: string | number;
  readonly reference_number: string | null;
  readonly notes: string | null;
  readonly journal_entry_id: string | null;
  readonly journal_number: string | null;
  readonly posted_by_email: string | null;
  readonly posted_at: string | null;
  readonly cancelled_by_email: string | null;
  readonly cancelled_at: string | null;
  readonly created_by_email: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface CustomerReceiptAllocationRowDto {
  readonly id: string;
  readonly customer_receipt_id: string;
  readonly sales_invoice_id: string;
  readonly invoice_number: string;
  readonly line_number: number;
  readonly allocated_amount: string | number;
}

export interface SupplierPaymentRowDto {
  readonly id: string;
  readonly payment_number: string;
  readonly supplier_id: string;
  readonly supplier_code: string;
  readonly supplier_name: string;
  readonly cash_bank_account_id: string;
  readonly cash_bank_account_code: string;
  readonly cash_bank_account_name: string;
  readonly status_code: 'draft' | 'posted' | 'cancelled';
  readonly status_label: string;
  readonly payment_method_code: string | null;
  readonly payment_method_label: string | null;
  readonly payment_date: string;
  readonly currency_code: string | null;
  readonly currency_label: string | null;
  readonly amount: string | number;
  readonly reference_number: string | null;
  readonly notes: string | null;
  readonly journal_entry_id: string | null;
  readonly journal_number: string | null;
  readonly posted_by_email: string | null;
  readonly posted_at: string | null;
  readonly cancelled_by_email: string | null;
  readonly cancelled_at: string | null;
  readonly created_by_email: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface SupplierPaymentAllocationRowDto {
  readonly id: string;
  readonly supplier_payment_id: string;
  readonly supplier_invoice_id: string;
  readonly invoice_number: string;
  readonly supplier_invoice_number: string | null;
  readonly line_number: number;
  readonly allocated_amount: string | number;
}
