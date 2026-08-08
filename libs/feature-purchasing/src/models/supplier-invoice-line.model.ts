export interface SupplierInvoiceLine {
  readonly id: string;
  readonly supplierInvoiceId: string;
  readonly lineNumber: number;
  readonly goodsReceiptLineId: string | null;
  readonly purchaseOrderLineId: string | null;
  readonly productId: string;
  readonly productSku: string;
  readonly productName: string;
  readonly description: string | null;
  readonly quantity: number;
  readonly unitCode: string;
  readonly unitLabel: string | null;
  readonly unitPrice: number;
  readonly taxRateCode: string | null;
  readonly taxRateLabel: string | null;
  readonly taxAmount: number;
  readonly lineTotal: number;
}
