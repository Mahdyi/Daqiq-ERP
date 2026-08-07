export interface SalesInvoiceEditorLine {
  readonly salesDeliveryLineId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly taxRateLookupValueId: string | null;
  readonly description: string | null;
}

export interface SalesInvoiceEditorLineDraft extends SalesInvoiceEditorLine {
  readonly remainingQuantity: number;
}

export interface SalesInvoiceEditorRequest {
  readonly salesDeliveryId: string;
  readonly invoiceDate: string;
  readonly dueDate: string | null;
  readonly notes: string | null;
  readonly lines: readonly SalesInvoiceEditorLine[];
}
