import type { PurchaseOrderStatus } from '../models/purchase-order-status.model';

export interface PurchaseOrderResponseDto {
  readonly id: string;
  readonly orderNumber: string;
  readonly supplierId: string;
  readonly supplierCode: string;
  readonly supplierName: string;
  readonly statusLookupValueId: string;
  readonly statusCode: PurchaseOrderStatus;
  readonly statusLabel: string;
  readonly orderDate: string;
  readonly expectedDate: string | null;
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
  readonly approvedByEmail: string | null;
  readonly approvedAt: string | null;
  readonly cancelledByEmail: string | null;
  readonly cancelledAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
