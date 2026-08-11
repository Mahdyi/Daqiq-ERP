export interface CustomerReceipt {
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
  readonly receiptDate: Date;
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

export interface CustomerReceiptAllocation {
  readonly id: string;
  readonly customerReceiptId: string;
  readonly salesInvoiceId: string;
  readonly invoiceNumber: string;
  readonly lineNumber: number;
  readonly allocatedAmount: number;
}
