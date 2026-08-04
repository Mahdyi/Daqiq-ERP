import type { PurchaseOrderLineRowDto } from '../dto/purchase-order-line-row.dto';
import type { PurchaseOrderResponseDto } from '../dto/purchase-order-response.dto';
import type { PurchaseOrderRowDto } from '../dto/purchase-order-row.dto';
import type { PurchaseOrderLine } from '../models/purchase-order-line.model';
import type { PurchaseOrder } from '../models/purchase-order.model';
import type { PurchaseOrderStatus } from '../models/purchase-order-status.model';

const PURCHASE_ORDER_STATUSES = new Set<PurchaseOrderStatus>([
  'draft',
  'submitted',
  'approved',
  'cancelled',
  'closed'
]);

export function mapPurchaseOrderRow(dto: PurchaseOrderRowDto): PurchaseOrder {
  return {
    id: dto.id,
    orderNumber: dto.order_number,
    supplierId: dto.supplier_id,
    supplierCode: dto.supplier_code,
    supplierName: dto.supplier_name,
    statusLookupValueId: dto.status_lookup_value_id,
    statusCode: normalizeStatus(dto.status_code),
    statusLabel: dto.status_label,
    orderDate: parseDate(dto.order_date),
    expectedDate: parseNullableDate(dto.expected_date),
    currencyLookupValueId: dto.currency_lookup_value_id,
    currencyCode: dto.currency_code,
    currencyLabel: dto.currency_label,
    deliveryWarehouseId: dto.delivery_warehouse_id,
    deliveryWarehouseCode: dto.delivery_warehouse_code,
    deliveryWarehouseName: dto.delivery_warehouse_name,
    subtotalAmount: toNumber(dto.subtotal_amount),
    taxAmount: toNumber(dto.tax_amount),
    totalAmount: toNumber(dto.total_amount),
    createdByEmail: dto.created_by_email,
    approvedByEmail: dto.approved_by_email,
    approvedAt: parseNullableDate(dto.approved_at),
    cancelledByEmail: dto.cancelled_by_email,
    cancelledAt: parseNullableDate(dto.cancelled_at),
    createdAt: parseDate(dto.created_at),
    updatedAt: parseDate(dto.updated_at)
  };
}

export function mapPurchaseOrderResponse(dto: PurchaseOrderResponseDto): PurchaseOrder {
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    supplierId: dto.supplierId,
    supplierCode: dto.supplierCode,
    supplierName: dto.supplierName,
    statusLookupValueId: dto.statusLookupValueId,
    statusCode: normalizeStatus(dto.statusCode),
    statusLabel: dto.statusLabel,
    orderDate: parseDate(dto.orderDate),
    expectedDate: parseNullableDate(dto.expectedDate),
    currencyLookupValueId: dto.currencyLookupValueId,
    currencyCode: dto.currencyCode,
    currencyLabel: dto.currencyLabel,
    deliveryWarehouseId: dto.deliveryWarehouseId,
    deliveryWarehouseCode: dto.deliveryWarehouseCode,
    deliveryWarehouseName: dto.deliveryWarehouseName,
    subtotalAmount: toNumber(dto.subtotalAmount),
    taxAmount: toNumber(dto.taxAmount),
    totalAmount: toNumber(dto.totalAmount),
    createdByEmail: dto.createdByEmail,
    approvedByEmail: dto.approvedByEmail,
    approvedAt: parseNullableDate(dto.approvedAt),
    cancelledByEmail: dto.cancelledByEmail,
    cancelledAt: parseNullableDate(dto.cancelledAt),
    createdAt: parseDate(dto.createdAt),
    updatedAt: parseDate(dto.updatedAt)
  };
}

export function mapPurchaseOrderLineRow(dto: PurchaseOrderLineRowDto): PurchaseOrderLine {
  return {
    id: dto.id,
    purchaseOrderId: dto.purchase_order_id,
    lineNumber: dto.line_number,
    productId: dto.product_id,
    productSku: dto.product_sku,
    productName: dto.product_name,
    description: dto.description,
    quantity: toNumber(dto.quantity),
    unitLookupValueId: dto.unit_lookup_value_id,
    unitCode: dto.unit_code,
    unitLabel: dto.unit_label,
    unitPrice: toNumber(dto.unit_price),
    taxRateLookupValueId: dto.tax_rate_lookup_value_id,
    taxRateCode: dto.tax_rate_code,
    taxRateLabel: dto.tax_rate_label,
    taxAmount: toNumber(dto.tax_amount),
    lineTotal: toNumber(dto.line_total)
  };
}

export function normalizeStatus(value: string): PurchaseOrderStatus {
  return PURCHASE_ORDER_STATUSES.has(value as PurchaseOrderStatus)
    ? (value as PurchaseOrderStatus)
    : 'draft';
}

function parseNullableDate(value: string | null): Date | null {
  return value ? parseDate(value) : null;
}

function parseDate(value: string): Date {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return new Date(0);
  }

  return parsed;
}

function toNumber(value: string | number): number {
  return typeof value === 'number' ? value : Number(value);
}
