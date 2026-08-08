export interface SupplierInvoiceEditorLine {
  readonly goodsReceiptLineId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly taxRateLookupValueId: string | null;
  readonly description: string | null;
}

export interface SupplierInvoiceEditorLineDraft extends SupplierInvoiceEditorLine {
  readonly remainingQuantity: number;
}

export interface SupplierInvoiceEditorRequest {
  readonly goodsReceiptId: string;
  readonly supplierInvoiceNumber: string | null;
  readonly invoiceDate: string;
  readonly dueDate: string | null;
  readonly notes: string | null;
  readonly lines: readonly SupplierInvoiceEditorLine[];
}
