export interface SalesDeliveryLine {
  readonly id: string;
  readonly salesDeliveryId: string;
  readonly lineNumber: number;
  readonly salesOrderLineId: string;
  readonly productId: string;
  readonly productSku: string;
  readonly productName: string;
  readonly shippedQuantity: number;
  readonly unitCode: string;
  readonly unitLabel: string | null;
  readonly storageLocationId: string | null;
  readonly storageLocationCode: string | null;
  readonly storageLocationName: string | null;
  readonly inventoryMovementId: string | null;
  readonly notes: string | null;
}
