export interface CustomerReceiptFormValue {
  readonly customerId: string | null;
  readonly cashBankAccountId: string | null;
  readonly receiptDate: Date | null;
  readonly currencyLookupValueId: string | null;
  readonly paymentMethodLookupValueId: string | null;
  readonly amount: number | null;
  readonly referenceNumber: string | null;
  readonly notes: string | null;
  readonly salesInvoiceId: string | null;
  readonly allocatedAmount: number | null;
}

export interface SupplierPaymentFormValue {
  readonly supplierId: string | null;
  readonly cashBankAccountId: string | null;
  readonly paymentDate: Date | null;
  readonly currencyLookupValueId: string | null;
  readonly paymentMethodLookupValueId: string | null;
  readonly amount: number | null;
  readonly referenceNumber: string | null;
  readonly notes: string | null;
  readonly supplierInvoiceId: string | null;
  readonly allocatedAmount: number | null;
}
