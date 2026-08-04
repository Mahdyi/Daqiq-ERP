import type { GoodsReceiptStatus } from './goods-receipt-status.model';

export interface GoodsReceipt {
  readonly id: string;
  readonly receiptNumber: string;
  readonly purchaseOrderId: string;
  readonly purchaseOrderNumber: string;
  readonly supplierId: string;
  readonly supplierCode: string;
  readonly supplierName: string;
  readonly statusCode: GoodsReceiptStatus;
  readonly statusLabel: string;
  readonly receiptDate: Date;
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
