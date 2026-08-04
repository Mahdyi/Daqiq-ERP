import type { SalesOrderLineRowDto } from '../dto/sales-order-line-row.dto';
import type { SalesOrderResponseDto } from '../dto/sales-order-response.dto';
import type { SalesOrderRowDto } from '../dto/sales-order-row.dto';
import type { SalesOrderLine } from '../models/sales-order-line.model';
import type { SalesOrder } from '../models/sales-order.model';
import type { SalesOrderStatus } from '../models/sales-order-status.model';

const SALES_ORDER_STATUSES = new Set<SalesOrderStatus>([
  'draft',
  'submitted',
  'confirmed',
  'cancelled',
  'closed'
]);

export function mapSalesOrderRow(dto: SalesOrderRowDto): SalesOrder {
  return {
    id: dto.id,
    orderNumber: dto.order_number,
    customerId: dto.customer_id,
    customerCode: dto.customer_code,
    customerName: dto.customer_name,
    statusLookupValueId: dto.status_lookup_value_id,
    statusCode: normalizeStatus(dto.status_code),
    statusLabel: dto.status_label,
    orderDate: parseDate(dto.order_date),
    requestedDeliveryDate: parseNullableDate(dto.requested_delivery_date),
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
    confirmedByEmail: dto.confirmed_by_email,
    confirmedAt: parseNullableDate(dto.confirmed_at),
    cancelledByEmail: dto.cancelled_by_email,
    cancelledAt: parseNullableDate(dto.cancelled_at),
    createdAt: parseDate(dto.created_at),
    updatedAt: parseDate(dto.updated_at)
  };
}

export function mapSalesOrderResponse(dto: SalesOrderResponseDto): SalesOrder {
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    customerId: dto.customerId,
    customerCode: dto.customerCode,
    customerName: dto.customerName,
    statusLookupValueId: dto.statusLookupValueId,
    statusCode: normalizeStatus(dto.statusCode),
    statusLabel: dto.statusLabel,
    orderDate: parseDate(dto.orderDate),
    requestedDeliveryDate: parseNullableDate(dto.requestedDeliveryDate),
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
    confirmedByEmail: dto.confirmedByEmail,
    confirmedAt: parseNullableDate(dto.confirmedAt),
    cancelledByEmail: dto.cancelledByEmail,
    cancelledAt: parseNullableDate(dto.cancelledAt),
    createdAt: parseDate(dto.createdAt),
    updatedAt: parseDate(dto.updatedAt)
  };
}

export function mapSalesOrderLineRow(dto: SalesOrderLineRowDto): SalesOrderLine {
  return {
    id: dto.id,
    salesOrderId: dto.sales_order_id,
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

export function normalizeStatus(value: string): SalesOrderStatus {
  return SALES_ORDER_STATUSES.has(value as SalesOrderStatus)
    ? (value as SalesOrderStatus)
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
