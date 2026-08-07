export interface SalesDeliveryLineInvoicingProgress {
  readonly salesDeliveryLineId: string;
  readonly salesDeliveryId: string;
  readonly salesOrderLineId: string;
  readonly productId: string;
  readonly productSku: string;
  readonly productName: string;
  readonly deliveredQuantity: number;
  readonly invoicedQuantity: number;
  readonly remainingQuantity: number;
  readonly unitLookupValueId: string;
  readonly unitCode: string;
  readonly unitLabel: string | null;
}
