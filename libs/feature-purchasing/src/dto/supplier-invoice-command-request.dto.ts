export interface CreateSupplierInvoiceLineRequestDto {
  readonly goodsReceiptLineId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly taxRateLookupValueId?: string | null;
  readonly description?: string | null;
}

export interface CreateSupplierInvoiceFromReceiptRequestDto {
  readonly goods_receipt_id: string;
  readonly supplier_invoice_number?: string | null;
  readonly invoice_date: string;
  readonly due_date?: string | null;
  readonly notes?: string | null;
  readonly lines: readonly CreateSupplierInvoiceLineRequestDto[];
}

export interface SupplierInvoiceTransitionRequestDto {
  readonly supplier_invoice_id: string;
}
