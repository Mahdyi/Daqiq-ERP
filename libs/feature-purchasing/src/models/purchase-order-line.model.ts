export interface PurchaseOrderLine {
  readonly id: string;
  readonly purchaseOrderId: string;
  readonly lineNumber: number;
  readonly productId: string;
  readonly productSku: string;
  readonly productName: string;
  readonly description: string | null;
  readonly quantity: number;
  readonly unitLookupValueId: string;
  readonly unitCode: string;
  readonly unitLabel: string;
  readonly unitPrice: number;
  readonly taxRateLookupValueId: string | null;
  readonly taxRateCode: string | null;
  readonly taxRateLabel: string | null;
  readonly taxAmount: number;
  readonly lineTotal: number;
}
