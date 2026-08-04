import type {
  PostGoodsReceiptLineRequestDto,
  PostGoodsReceiptRequestDto
} from '../dto/post-goods-receipt-request.dto';
import type {
  GoodsReceiptPostingFormValue,
  GoodsReceiptPostingLineValue
} from '../models/goods-receipt-posting-form.model';

export function mapPostingFormToRequest(
  purchaseOrderId: string,
  value: Readonly<GoodsReceiptPostingFormValue>
): PostGoodsReceiptRequestDto {
  if (!value.warehouseId) {
    throw new Error('Warehouse is required for goods receipt posting.');
  }

  return {
    purchase_order_id: purchaseOrderId,
    receipt_date: value.receiptDate,
    warehouse_id: value.warehouseId,
    notes: normalizeOptionalText(value.notes),
    lines: value.lines
      .map(mapPostingLineToRequest)
      .filter((line): line is PostGoodsReceiptLineRequestDto => line !== null)
  };
}

function mapPostingLineToRequest(
  line: Readonly<GoodsReceiptPostingLineValue>
): PostGoodsReceiptLineRequestDto | null {
  if (line.receivedQuantity === null || line.receivedQuantity <= 0) {
    return null;
  }

  return {
    purchase_order_line_id: line.purchaseOrderLineId,
    received_quantity: line.receivedQuantity,
    storage_location_id: line.storageLocationId,
    notes: normalizeOptionalText(line.notes)
  };
}

function normalizeOptionalText(value: string | null): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}
