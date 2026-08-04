import type { SalesDeliveryStatus } from './sales-delivery-status.model';

export interface SalesDelivery {
  readonly id: string;
  readonly deliveryNumber: string;
  readonly salesOrderId: string;
  readonly salesOrderNumber: string;
  readonly customerId: string;
  readonly customerCode: string;
  readonly customerName: string;
  readonly statusCode: SalesDeliveryStatus;
  readonly statusLabel: string;
  readonly deliveryDate: Date;
  readonly warehouseId: string;
  readonly warehouseCode: string;
  readonly warehouseName: string;
  readonly notes: string | null;
  readonly postedByEmail: string | null;
  readonly postedAt: Date | null;
  readonly cancelledByEmail: string | null;
  readonly cancelledAt: Date | null;
  readonly createdByEmail: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
