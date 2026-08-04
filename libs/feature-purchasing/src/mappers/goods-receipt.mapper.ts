import type { GoodsReceiptLineRowDto } from '../dto/goods-receipt-line-row.dto';
import type { GoodsReceiptResponseDto } from '../dto/goods-receipt-response.dto';
import type { GoodsReceiptRowDto } from '../dto/goods-receipt-row.dto';
import type { PurchaseOrderLineReceivingProgressRowDto } from '../dto/purchase-order-receiving-progress-row.dto';
import type { GoodsReceiptLine } from '../models/goods-receipt-line.model';
import type { GoodsReceipt } from '../models/goods-receipt.model';
import type { GoodsReceiptStatus } from '../models/goods-receipt-status.model';
import type { PurchaseOrderLineReceivingProgress } from '../models/purchase-order-receiving-progress.model';

const GOODS_RECEIPT_STATUSES = new Set<GoodsReceiptStatus>([
  'draft',
  'posted',
  'cancelled'
]);

export function mapGoodsReceiptRow(dto: GoodsReceiptRowDto): GoodsReceipt {
  return {
    id: dto.id,
    receiptNumber: dto.receipt_number,
    purchaseOrderId: dto.purchase_order_id,
    purchaseOrderNumber: dto.purchase_order_number,
    supplierId: dto.supplier_id,
    supplierCode: dto.supplier_code,
    supplierName: dto.supplier_name,
    statusCode: normalizeGoodsReceiptStatus(dto.status_code),
    statusLabel: dto.status_label,
    receiptDate: parseDate(dto.receipt_date),
    warehouseId: dto.warehouse_id,
    warehouseCode: dto.warehouse_code,
    warehouseName: dto.warehouse_name,
    notes: dto.notes,
    postedByEmail: dto.posted_by_email,
    postedAt: parseNullableDate(dto.posted_at),
    cancelledByEmail: dto.cancelled_by_email,
    cancelledAt: parseNullableDate(dto.cancelled_at),
    createdByEmail: dto.created_by_email,
    createdAt: parseDate(dto.created_at),
    updatedAt: parseDate(dto.updated_at)
  };
}

export function mapGoodsReceiptResponse(dto: GoodsReceiptResponseDto): GoodsReceipt {
  return {
    id: dto.id,
    receiptNumber: dto.receiptNumber,
    purchaseOrderId: dto.purchaseOrderId,
    purchaseOrderNumber: dto.purchaseOrderNumber,
    supplierId: dto.supplierId,
    supplierCode: dto.supplierCode,
    supplierName: dto.supplierName,
    statusCode: normalizeGoodsReceiptStatus(dto.statusCode),
    statusLabel: dto.statusLabel,
    receiptDate: parseDate(dto.receiptDate),
    warehouseId: dto.warehouseId,
    warehouseCode: dto.warehouseCode,
    warehouseName: dto.warehouseName,
    notes: dto.notes,
    postedByEmail: dto.postedByEmail,
    postedAt: parseNullableDate(dto.postedAt),
    cancelledByEmail: dto.cancelledByEmail,
    cancelledAt: parseNullableDate(dto.cancelledAt),
    createdByEmail: dto.createdByEmail,
    createdAt: parseDate(dto.createdAt),
    updatedAt: parseDate(dto.updatedAt)
  };
}

export function mapGoodsReceiptLineRow(dto: GoodsReceiptLineRowDto): GoodsReceiptLine {
  return {
    id: dto.id,
    goodsReceiptId: dto.goods_receipt_id,
    lineNumber: dto.line_number,
    purchaseOrderLineId: dto.purchase_order_line_id,
    productId: dto.product_id,
    productSku: dto.product_sku,
    productName: dto.product_name,
    receivedQuantity: toNumber(dto.received_quantity),
    unitCode: dto.unit_code,
    unitLabel: dto.unit_label,
    storageLocationId: dto.storage_location_id,
    storageLocationCode: dto.storage_location_code,
    storageLocationName: dto.storage_location_name,
    inventoryMovementId: dto.inventory_movement_id,
    inventoryMovementNumber: dto.inventory_movement_number,
    notes: dto.notes
  };
}

export function mapPurchaseOrderLineReceivingProgressRow(
  dto: PurchaseOrderLineReceivingProgressRowDto
): PurchaseOrderLineReceivingProgress {
  return {
    purchaseOrderLineId: dto.purchase_order_line_id,
    purchaseOrderId: dto.purchase_order_id,
    productId: dto.product_id,
    productSku: dto.product_sku,
    productName: dto.product_name,
    orderedQuantity: toNumber(dto.ordered_quantity),
    receivedQuantity: toNumber(dto.received_quantity),
    remainingQuantity: toNumber(dto.remaining_quantity),
    unitLookupValueId: dto.unit_lookup_value_id,
    unitCode: dto.unit_code,
    unitLabel: dto.unit_label
  };
}

export function normalizeGoodsReceiptStatus(value: string): GoodsReceiptStatus {
  return GOODS_RECEIPT_STATUSES.has(value as GoodsReceiptStatus)
    ? (value as GoodsReceiptStatus)
    : 'draft';
}

function parseNullableDate(value: string | null): Date | null {
  return value ? parseDate(value) : null;
}

function parseDate(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function toNumber(value: string | number): number {
  return typeof value === 'number' ? value : Number(value);
}
