export interface CreateSalesInvoiceLineRequestDto {
  readonly salesDeliveryLineId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly taxRateLookupValueId?: string | null;
  readonly description?: string | null;
}

export interface CreateSalesInvoiceFromDeliveryRequestDto {
  readonly sales_delivery_id: string;
  readonly invoice_date: string;
  readonly due_date?: string | null;
  readonly notes?: string | null;
  readonly lines: readonly CreateSalesInvoiceLineRequestDto[];
}

export interface SalesInvoiceTransitionRequestDto {
  readonly sales_invoice_id: string;
}
