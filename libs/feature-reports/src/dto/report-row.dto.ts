export type NumericDtoValue = number | string;

export interface InventoryOnHandReportRowDto {
  readonly product_id: string;
  readonly product_sku: string;
  readonly product_name: string;
  readonly product_type: string;
  readonly warehouse_id: string;
  readonly warehouse_code: string;
  readonly warehouse_name: string;
  readonly storage_location_id: string | null;
  readonly storage_location_code: string | null;
  readonly storage_location_name: string | null;
  readonly unit_code: string | null;
  readonly unit_label: string | null;
  readonly quantity_on_hand: NumericDtoValue;
  readonly last_movement_at: string | null;
}

export interface InventoryMovementSummaryReportRowDto {
  readonly product_id: string;
  readonly product_sku: string;
  readonly product_name: string;
  readonly warehouse_id: string | null;
  readonly warehouse_code: string | null;
  readonly warehouse_name: string | null;
  readonly movement_type_code: string;
  readonly movement_type_label: string;
  readonly movement_count: NumericDtoValue;
  readonly total_quantity_in: NumericDtoValue;
  readonly total_quantity_out: NumericDtoValue;
  readonly first_movement_at: string | null;
  readonly last_movement_at: string | null;
}

export interface AmountStatusReportRowDto {
  readonly status_code: string;
  readonly status_label: string;
  readonly order_count: NumericDtoValue;
  readonly subtotal_amount: NumericDtoValue;
  readonly tax_amount: NumericDtoValue;
  readonly total_amount: NumericDtoValue;
}

export interface GoodsReceiptStatusReportRowDto {
  readonly status_code: string;
  readonly status_label: string;
  readonly receipt_count: NumericDtoValue;
  readonly line_count: NumericDtoValue;
  readonly total_received_quantity: NumericDtoValue;
}

export interface SalesDeliveryStatusReportRowDto {
  readonly status_code: string;
  readonly status_label: string;
  readonly delivery_count: NumericDtoValue;
  readonly line_count: NumericDtoValue;
  readonly total_shipped_quantity: NumericDtoValue;
}

export interface SalesInvoiceSettlementReportRowDto {
  readonly customer_id: string;
  readonly customer_code: string;
  readonly customer_name: string;
  readonly invoice_count: NumericDtoValue;
  readonly total_invoiced_amount: NumericDtoValue;
  readonly total_paid_amount: NumericDtoValue;
  readonly total_remaining_amount: NumericDtoValue;
  readonly overdue_amount: NumericDtoValue;
}

export interface SupplierInvoiceSettlementReportRowDto {
  readonly supplier_id: string;
  readonly supplier_code: string;
  readonly supplier_name: string;
  readonly invoice_count: NumericDtoValue;
  readonly total_invoiced_amount: NumericDtoValue;
  readonly total_paid_amount: NumericDtoValue;
  readonly total_remaining_amount: NumericDtoValue;
  readonly overdue_amount: NumericDtoValue;
}

export interface GeneralLedgerSummaryReportRowDto {
  readonly account_id: string;
  readonly account_code: string;
  readonly account_name: string;
  readonly account_type_code: string;
  readonly debit_amount: NumericDtoValue;
  readonly credit_amount: NumericDtoValue;
  readonly net_amount: NumericDtoValue;
  readonly journal_line_count: NumericDtoValue;
}

export interface JournalActivityReportRowDto {
  readonly source_type_code: string;
  readonly source_type_label: string;
  readonly journal_count: NumericDtoValue;
  readonly total_debit: NumericDtoValue;
  readonly total_credit: NumericDtoValue;
  readonly first_journal_date: string | null;
  readonly last_journal_date: string | null;
}

export interface PaymentSummaryReportRowDto {
  readonly payment_direction: 'customer_receipt' | 'supplier_payment';
  readonly payment_count: NumericDtoValue;
  readonly total_amount: NumericDtoValue;
  readonly first_payment_date: string | null;
  readonly last_payment_date: string | null;
}

export interface AuditActivitySummaryReportRowDto {
  readonly action: string;
  readonly entity_type: string;
  readonly actor_email: string | null;
  readonly event_count: NumericDtoValue;
  readonly first_event_at: string | null;
  readonly last_event_at: string | null;
}
