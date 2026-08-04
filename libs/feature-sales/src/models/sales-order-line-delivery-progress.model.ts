export interface SalesOrderLineDeliveryProgress {
  readonly salesOrderLineId: string;
  readonly salesOrderId: string;
  readonly productId: string;
  readonly productSku: string;
  readonly productName: string;
  readonly orderedQuantity: number;
  readonly shippedQuantity: number;
  readonly remainingQuantity: number;
  readonly unitLookupValueId: string;
  readonly unitCode: string;
  readonly unitLabel: string | null;
}
