import type { SalesOrderStatus } from '../models/sales-order-status.model';

export interface SalesOrderResponseDto {
  readonly id: string;
  readonly orderNumber: string;
  readonly customerId: string;
  readonly customerCode: string;
  readonly customerName: string;
  readonly statusLookupValueId: string;
  readonly statusCode: SalesOrderStatus;
  readonly statusLabel: string;
  readonly orderDate: string;
  readonly requestedDeliveryDate: string | null;
  readonly currencyLookupValueId: string | null;
  readonly currencyCode: string | null;
  readonly currencyLabel: string | null;
  readonly deliveryWarehouseId: string | null;
  readonly deliveryWarehouseCode: string | null;
  readonly deliveryWarehouseName: string | null;
  readonly subtotalAmount: string | number;
  readonly taxAmount: string | number;
  readonly totalAmount: string | number;
  readonly createdByEmail: string | null;
  readonly confirmedByEmail: string | null;
  readonly confirmedAt: string | null;
  readonly cancelledByEmail: string | null;
  readonly cancelledAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
