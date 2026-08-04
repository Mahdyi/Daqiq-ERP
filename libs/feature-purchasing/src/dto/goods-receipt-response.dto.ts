import type { GoodsReceiptStatus } from '../models/goods-receipt-status.model';

export interface GoodsReceiptResponseDto {
  readonly id: string;
  readonly receiptNumber: string;
  readonly purchaseOrderId: string;
  readonly purchaseOrderNumber: string;
  readonly supplierId: string;
  readonly supplierCode: string;
  readonly supplierName: string;
  readonly statusCode: GoodsReceiptStatus;
  readonly statusLabel: string;
  readonly receiptDate: string;
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
}
