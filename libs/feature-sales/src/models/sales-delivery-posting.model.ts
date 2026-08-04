export interface SalesDeliveryPostingLine {
  readonly salesOrderLineId: string;
  readonly shippedQuantity: number;
  readonly storageLocationId: string | null;
  readonly notes: string | null;
}

export interface SalesDeliveryPostingRequest {
  readonly salesOrderId: string;
  readonly deliveryDate: string;
  readonly warehouseId: string;
  readonly notes: string | null;
  readonly lines: readonly SalesDeliveryPostingLine[];
}
