export interface GoodsReceiptPostingLineValue {
  readonly purchaseOrderLineId: string;
  readonly receivedQuantity: number | null;
  readonly storageLocationId: string | null;
  readonly notes: string | null;
}

export interface GoodsReceiptPostingFormValue {
  readonly receiptDate: string;
  readonly warehouseId: string | null;
  readonly notes: string | null;
  readonly lines: readonly GoodsReceiptPostingLineValue[];
}
