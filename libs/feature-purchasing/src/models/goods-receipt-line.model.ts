export interface GoodsReceiptLine {
  readonly id: string;
  readonly goodsReceiptId: string;
  readonly lineNumber: number;
  readonly purchaseOrderLineId: string;
  readonly productId: string;
  readonly productSku: string;
  readonly productName: string;
  readonly receivedQuantity: number;
  readonly unitCode: string;
  readonly unitLabel: string | null;
  readonly storageLocationId: string | null;
  readonly storageLocationCode: string | null;
  readonly storageLocationName: string | null;
  readonly inventoryMovementId: string | null;
  readonly inventoryMovementNumber: string | null;
  readonly notes: string | null;
}
