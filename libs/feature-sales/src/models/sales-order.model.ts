import type { SalesOrderStatus } from './sales-order-status.model';

export interface SalesOrder {
  readonly id: string;
  readonly orderNumber: string;
  readonly customerId: string;
  readonly customerCode: string;
  readonly customerName: string;
  readonly statusLookupValueId: string;
  readonly statusCode: SalesOrderStatus;
  readonly statusLabel: string;
  readonly orderDate: Date;
  readonly requestedDeliveryDate: Date | null;
  readonly currencyLookupValueId: string | null;
  readonly currencyCode: string | null;
  readonly currencyLabel: string | null;
  readonly deliveryWarehouseId: string | null;
  readonly deliveryWarehouseCode: string | null;
  readonly deliveryWarehouseName: string | null;
  readonly subtotalAmount: number;
  readonly taxAmount: number;
  readonly totalAmount: number;
  readonly createdByEmail: string | null;
  readonly confirmedByEmail: string | null;
  readonly confirmedAt: Date | null;
  readonly cancelledByEmail: string | null;
  readonly cancelledAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
