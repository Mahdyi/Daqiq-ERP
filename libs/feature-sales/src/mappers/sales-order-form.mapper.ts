import type {
  CreateSalesOrderRequestDto,
  SalesOrderLineRequestDto
} from '../dto/create-sales-order-request.dto';
import type { UpdateSalesOrderRequestDto } from '../dto/update-sales-order-request.dto';
import type { SalesOrderLine } from '../models/sales-order-line.model';
import type {
  SalesOrderFormValue,
  SalesOrderLineFormValue
} from '../models/sales-order-form-value.model';
import type { SalesOrder } from '../models/sales-order.model';

export const DEFAULT_SALES_ORDER_FORM_VALUE: SalesOrderFormValue = {
  customerId: null,
  orderDate: new Date(),
  requestedDeliveryDate: null,
  currencyLookupValueId: null,
  deliveryWarehouseId: null,
  notes: null
};

export function mapSalesOrderToFormValue(order: SalesOrder): SalesOrderFormValue {
  return {
    customerId: order.customerId,
    orderDate: order.orderDate,
    requestedDeliveryDate: order.requestedDeliveryDate,
    currencyLookupValueId: order.currencyLookupValueId,
    deliveryWarehouseId: order.deliveryWarehouseId,
    notes: null
  };
}

export function mapLineToFormValue(line: SalesOrderLine): SalesOrderLineFormValue {
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

export function mapFormToCreateSalesOrderRequest(
  value: Readonly<SalesOrderFormValue>,
  lines: readonly SalesOrderLineFormValue[]
): CreateSalesOrderRequestDto {
  return {
    customer_id: requireString(value.customerId, 'Customer is required.'),
    order_date: formatDate(requireDate(value.orderDate, 'Order date is required.')),
    requested_delivery_date: formatNullableDate(value.requestedDeliveryDate),
    currency_lookup_value_id: normalizeOptionalString(value.currencyLookupValueId),
    delivery_warehouse_id: normalizeOptionalString(value.deliveryWarehouseId),
    notes: normalizeOptionalString(value.notes),
    lines: mapLineRequests(lines)
  };
}

export function mapFormToUpdateSalesOrderRequest(
  salesOrderId: string,
  value: Readonly<SalesOrderFormValue>,
  lines: readonly SalesOrderLineFormValue[]
): UpdateSalesOrderRequestDto {
  return {
    sales_order_id: salesOrderId,
    customer_id: requireString(value.customerId, 'Customer is required.'),
    order_date: formatDate(requireDate(value.orderDate, 'Order date is required.')),
    requested_delivery_date: formatNullableDate(value.requestedDeliveryDate),
    currency_lookup_value_id: normalizeOptionalString(value.currencyLookupValueId),
    delivery_warehouse_id: normalizeOptionalString(value.deliveryWarehouseId),
    notes: normalizeOptionalString(value.notes),
    lines: mapLineRequests(lines)
  };
}

function mapLineRequests(
  lines: readonly SalesOrderLineFormValue[]
): readonly SalesOrderLineRequestDto[] {
  if (lines.length === 0) {
    throw new Error('Sales order must contain at least one line.');
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
