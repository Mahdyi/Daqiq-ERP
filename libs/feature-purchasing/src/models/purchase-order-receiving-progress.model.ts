export interface PurchaseOrderLineReceivingProgress {
  readonly purchaseOrderLineId: string;
  readonly purchaseOrderId: string;
  readonly productId: string;
  readonly productSku: string;
  readonly productName: string;
  readonly orderedQuantity: number;
  readonly receivedQuantity: number;
  readonly remainingQuantity: number;
  readonly unitLookupValueId: string;
  readonly unitCode: string;
  readonly unitLabel: string | null;
}
