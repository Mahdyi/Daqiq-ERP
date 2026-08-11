export interface CustomerReceiptAllocationRequestDto {
  readonly salesInvoiceId: string;
  readonly allocatedAmount: number;
}

export interface PostCustomerReceiptRequestDto {
  readonly customer_id: string;
  readonly cash_bank_account_id: string;
  readonly receipt_date: string;
  readonly currency_lookup_value_id?: string | null;
  readonly payment_method_lookup_value_id?: string | null;
  readonly amount: number;
  readonly reference_number?: string | null;
  readonly notes?: string | null;
  readonly allocations: readonly CustomerReceiptAllocationRequestDto[];
}

export interface SupplierPaymentAllocationRequestDto {
  readonly supplierInvoiceId: string;
  readonly allocatedAmount: number;
}

export interface PostSupplierPaymentRequestDto {
  readonly supplier_id: string;
  readonly cash_bank_account_id: string;
  readonly payment_date: string;
  readonly currency_lookup_value_id?: string | null;
  readonly payment_method_lookup_value_id?: string | null;
  readonly amount: number;
  readonly reference_number?: string | null;
  readonly notes?: string | null;
  readonly allocations: readonly SupplierPaymentAllocationRequestDto[];
}

export interface CustomerReceiptResponseAllocationDto {
  readonly id: string;
  readonly customerReceiptId: string;
  readonly salesInvoiceId: string;
  readonly invoiceNumber: string;
  readonly lineNumber: number;
  readonly allocatedAmount: string | number;
}

export interface CustomerReceiptResponseDto {
  readonly id: string;
  readonly receiptNumber: string;
  readonly customerId: string;
  readonly customerCode: string;
  readonly customerName: string;
  readonly cashBankAccountId: string;
  readonly cashBankAccountCode: string;
  readonly cashBankAccountName: string;
  readonly statusCode: 'draft' | 'posted' | 'cancelled';
  readonly statusLabel: string;
  readonly paymentMethodCode: string | null;
  readonly paymentMethodLabel: string | null;
  readonly receiptDate: string;
  readonly currencyCode: string | null;
  readonly currencyLabel: string | null;
  readonly amount: string | number;
  readonly referenceNumber: string | null;
  readonly notes: string | null;
  readonly journalEntryId: string | null;
  readonly journalNumber: string | null;
  readonly postedByEmail: string | null;
  readonly postedAt: string | null;
  readonly cancelledByEmail: string | null;
  readonly cancelledAt: string | null;
  readonly createdByEmail: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly allocations: readonly CustomerReceiptResponseAllocationDto[];
}

export interface SupplierPaymentResponseAllocationDto {
  readonly id: string;
  readonly supplierPaymentId: string;
  readonly supplierInvoiceId: string;
  readonly invoiceNumber: string;
  readonly supplierInvoiceNumber: string | null;
  readonly lineNumber: number;
  readonly allocatedAmount: string | number;
}

export interface SupplierPaymentResponseDto {
  readonly id: string;
  readonly paymentNumber: string;
  readonly supplierId: string;
  readonly supplierCode: string;
  readonly supplierName: string;
  readonly cashBankAccountId: string;
  readonly cashBankAccountCode: string;
  readonly cashBankAccountName: string;
  readonly statusCode: 'draft' | 'posted' | 'cancelled';
  readonly statusLabel: string;
  readonly paymentMethodCode: string | null;
  readonly paymentMethodLabel: string | null;
  readonly paymentDate: string;
  readonly currencyCode: string | null;
  readonly currencyLabel: string | null;
  readonly amount: string | number;
  readonly referenceNumber: string | null;
  readonly notes: string | null;
  readonly journalEntryId: string | null;
  readonly journalNumber: string | null;
  readonly postedByEmail: string | null;
  readonly postedAt: string | null;
  readonly cancelledByEmail: string | null;
  readonly cancelledAt: string | null;
  readonly createdByEmail: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly allocations: readonly SupplierPaymentResponseAllocationDto[];
}
