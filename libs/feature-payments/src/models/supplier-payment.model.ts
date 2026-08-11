export interface SupplierPayment {
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
  readonly paymentDate: Date;
  readonly currencyCode: string | null;
  readonly currencyLabel: string | null;
  readonly amount: number;
  readonly referenceNumber: string | null;
  readonly notes: string | null;
  readonly journalEntryId: string | null;
  readonly journalNumber: string | null;
  readonly postedByEmail: string | null;
  readonly postedAt: Date | null;
  readonly cancelledByEmail: string | null;
  readonly cancelledAt: Date | null;
  readonly createdByEmail: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SupplierPaymentAllocation {
  readonly id: string;
  readonly supplierPaymentId: string;
  readonly supplierInvoiceId: string;
  readonly invoiceNumber: string;
  readonly supplierInvoiceNumber: string | null;
  readonly lineNumber: number;
  readonly allocatedAmount: number;
}
