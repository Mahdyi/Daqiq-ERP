import type {
  CreatePurchaseOrderRequestDto,
  PurchaseOrderLineRequestDto
} from '../dto/create-purchase-order-request.dto';
import type { UpdatePurchaseOrderRequestDto } from '../dto/update-purchase-order-request.dto';
import type { PurchaseOrderLine } from '../models/purchase-order-line.model';
import type {
  PurchaseOrderFormValue,
  PurchaseOrderLineFormValue
} from '../models/purchase-order-form-value.model';
import type { PurchaseOrder } from '../models/purchase-order.model';

export const DEFAULT_PURCHASE_ORDER_FORM_VALUE: PurchaseOrderFormValue = {
  supplierId: null,
  orderDate: new Date(),
  expectedDate: null,
  currencyLookupValueId: null,
  deliveryWarehouseId: null,
  notes: null
};

export function mapPurchaseOrderToFormValue(
  order: PurchaseOrder
): PurchaseOrderFormValue {
  return {
    supplierId: order.supplierId,
    orderDate: order.orderDate,
    expectedDate: order.expectedDate,
    currencyLookupValueId: order.currencyLookupValueId,
    deliveryWarehouseId: order.deliveryWarehouseId,
    notes: null
  };
}

export function mapLineToFormValue(line: PurchaseOrderLine): PurchaseOrderLineFormValue {
  return {
    clientId: line.id,
    productId: line.productId,
    description: line.description,
    quantity: line.quantity,
    unitLookupValueId: line.unitLookupValueId,
    unitPrice: line.unitPrice,
    taxRateLookupValueId: line.taxRateLookupValueId
  };
}

export function mapFormToCreatePurchaseOrderRequest(
  value: Readonly<PurchaseOrderFormValue>,
  lines: readonly PurchaseOrderLineFormValue[]
): CreatePurchaseOrderRequestDto {
  return {
    supplier_id: requireString(value.supplierId, 'Supplier is required.'),
    order_date: formatDate(requireDate(value.orderDate, 'Order date is required.')),
    expected_date: formatNullableDate(value.expectedDate),
    currency_lookup_value_id: normalizeOptionalString(value.currencyLookupValueId),
    delivery_warehouse_id: normalizeOptionalString(value.deliveryWarehouseId),
    notes: normalizeOptionalString(value.notes),
    lines: mapLineRequests(lines)
  };
}

export function mapFormToUpdatePurchaseOrderRequest(
  purchaseOrderId: string,
  value: Readonly<PurchaseOrderFormValue>,
  lines: readonly PurchaseOrderLineFormValue[]
): UpdatePurchaseOrderRequestDto {
  return {
    purchase_order_id: purchaseOrderId,
    supplier_id: requireString(value.supplierId, 'Supplier is required.'),
    order_date: formatDate(requireDate(value.orderDate, 'Order date is required.')),
    expected_date: formatNullableDate(value.expectedDate),
    currency_lookup_value_id: normalizeOptionalString(value.currencyLookupValueId),
    delivery_warehouse_id: normalizeOptionalString(value.deliveryWarehouseId),
    notes: normalizeOptionalString(value.notes),
    lines: mapLineRequests(lines)
  };
}

function mapLineRequests(
  lines: readonly PurchaseOrderLineFormValue[]
): readonly PurchaseOrderLineRequestDto[] {
  if (lines.length === 0) {
    throw new Error('Purchase order must contain at least one line.');
  }

  return lines.map((line) => ({
    product_id: requireString(line.productId, 'Product is required.'),
    description: normalizeOptionalString(line.description),
    quantity: requirePositiveNumber(line.quantity, 'Quantity must be greater than zero.'),
    unit_lookup_value_id: requireString(line.unitLookupValueId, 'Unit is required.'),
    unit_price: requireNonNegativeNumber(line.unitPrice, 'Unit price cannot be negative.'),
    tax_rate_lookup_value_id: normalizeOptionalString(line.taxRateLookupValueId)
  }));
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}

function requireString(value: string | null | undefined, message: string): string {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    throw new Error(message);
  }

  return normalized;
}

function requireDate(value: Date | null, message: string): Date {
  if (!value || Number.isNaN(value.getTime())) {
    throw new Error(message);
  }

  return value;
}

function requirePositiveNumber(value: number | null, message: string): number {
  if (value === null || value <= 0) {
    throw new Error(message);
  }

  return value;
}

function requireNonNegativeNumber(value: number | null, message: string): number {
  if (value === null || value < 0) {
    throw new Error(message);
  }

  return value;
}

function formatNullableDate(value: Date | null): string | null {
  return value ? formatDate(value) : null;
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}
