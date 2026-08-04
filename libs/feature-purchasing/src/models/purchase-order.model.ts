import type { PurchaseOrderStatus } from './purchase-order-status.model';

export interface PurchaseOrder {
  readonly id: string;
  readonly orderNumber: string;
  readonly supplierId: string;
  readonly supplierCode: string;
  readonly supplierName: string;
  readonly statusLookupValueId: string;
  readonly statusCode: PurchaseOrderStatus;
  readonly statusLabel: string;
  readonly orderDate: Date;
  readonly expectedDate: Date | null;
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
  readonly approvedByEmail: string | null;
  readonly approvedAt: Date | null;
  readonly cancelledByEmail: string | null;
  readonly cancelledAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
