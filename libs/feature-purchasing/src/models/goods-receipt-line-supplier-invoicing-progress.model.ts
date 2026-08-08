export interface GoodsReceiptLineSupplierInvoicingProgress {
  readonly goodsReceiptLineId: string;
  readonly goodsReceiptId: string;
  readonly purchaseOrderLineId: string;
  readonly productId: string;
  readonly productSku: string;
  readonly productName: string;
  readonly receivedQuantity: number;
  readonly invoicedQuantity: number;
  readonly remainingQuantity: number;
  readonly unitLookupValueId: string;
  readonly unitCode: string;
  readonly unitLabel: string | null;
}
