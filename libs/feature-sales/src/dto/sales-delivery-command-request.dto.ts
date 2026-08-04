export interface PostSalesDeliveryLineRequestDto {
  readonly salesOrderLineId: string;
  readonly shippedQuantity: number;
  readonly storageLocationId?: string | null;
  readonly notes?: string | null;
}

export interface PostSalesDeliveryRequestDto {
  readonly sales_order_id: string;
  readonly delivery_date: string;
  readonly warehouse_id: string;
  readonly notes?: string | null;
  readonly lines: readonly PostSalesDeliveryLineRequestDto[];
}

export interface CancelSalesDeliveryRequestDto {
  readonly sales_delivery_id: string;
}
