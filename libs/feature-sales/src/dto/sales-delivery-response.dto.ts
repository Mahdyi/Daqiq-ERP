import type { SalesDeliveryStatus } from '../models/sales-delivery-status.model';

export interface SalesDeliveryResponseLineDto {
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

export interface SalesDeliveryResponseDto {
  readonly id: string;
  readonly deliveryNumber: string;
  readonly salesOrderId: string;
  readonly salesOrderNumber: string;
  readonly customerId: string;
  readonly customerCode: string;
  readonly customerName: string;
  readonly statusCode: SalesDeliveryStatus;
  readonly statusLabel: string;
  readonly deliveryDate: string;
  readonly warehouseId: string;
  readonly warehouseCode: string;
  readonly warehouseName: string;
  readonly notes: string | null;
  readonly postedByEmail: string | null;
  readonly postedAt: string | null;
  readonly cancelledByEmail: string | null;
  readonly cancelledAt: string | null;
  readonly createdByEmail: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lines: readonly SalesDeliveryResponseLineDto[];
}
