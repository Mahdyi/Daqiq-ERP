import type { SalesDeliveryLineRowDto } from '../dto/sales-delivery-line-row.dto';
import type { SalesDeliveryResponseDto } from '../dto/sales-delivery-response.dto';
import type { SalesDeliveryRowDto } from '../dto/sales-delivery-row.dto';
import type { SalesOrderLineDeliveryProgressRowDto } from '../dto/sales-order-line-delivery-progress-row.dto';
import type { SalesDeliveryLine } from '../models/sales-delivery-line.model';
import type { SalesDelivery } from '../models/sales-delivery.model';
import type { SalesOrderLineDeliveryProgress } from '../models/sales-order-line-delivery-progress.model';

export function mapSalesDeliveryRow(row: SalesDeliveryRowDto): SalesDelivery {
  return {
    id: row.id,
    deliveryNumber: row.delivery_number,
    salesOrderId: row.sales_order_id,
    salesOrderNumber: row.sales_order_number,
    customerId: row.customer_id,
    customerCode: row.customer_code,
    customerName: row.customer_name,
    statusCode: row.status_code,
    statusLabel: row.status_label,
    deliveryDate: parseDate(row.delivery_date),
    warehouseId: row.warehouse_id,
    warehouseCode: row.warehouse_code,
    warehouseName: row.warehouse_name,
    notes: row.notes,
    postedByEmail: row.posted_by_email,
    postedAt: parseNullableDate(row.posted_at),
    cancelledByEmail: row.cancelled_by_email,
    cancelledAt: parseNullableDate(row.cancelled_at),
    createdByEmail: row.created_by_email,
    createdAt: parseDate(row.created_at),
    updatedAt: parseDate(row.updated_at)
  };
}

export function mapSalesDeliveryLineRow(row: SalesDeliveryLineRowDto): SalesDeliveryLine {
  return {
    id: row.id,
    salesDeliveryId: row.sales_delivery_id,
    lineNumber: row.line_number,
    salesOrderLineId: row.sales_order_line_id,
    productId: row.product_id,
    productSku: row.product_sku,
    productName: row.product_name,
    shippedQuantity: Number(row.shipped_quantity),
    unitCode: row.unit_code,
    unitLabel: row.unit_label,
    storageLocationId: row.storage_location_id,
    storageLocationCode: row.storage_location_code,
    storageLocationName: row.storage_location_name,
    inventoryMovementId: row.inventory_movement_id,
    notes: row.notes
  };
}

export function mapSalesOrderLineDeliveryProgressRow(
  row: SalesOrderLineDeliveryProgressRowDto
): SalesOrderLineDeliveryProgress {
  return {
    salesOrderLineId: row.sales_order_line_id,
    salesOrderId: row.sales_order_id,
    productId: row.product_id,
    productSku: row.product_sku,
    productName: row.product_name,
    orderedQuantity: Number(row.ordered_quantity),
    shippedQuantity: Number(row.shipped_quantity),
    remainingQuantity: Number(row.remaining_quantity),
    unitLookupValueId: row.unit_lookup_value_id,
    unitCode: row.unit_code,
    unitLabel: row.unit_label
  };
}

export function mapSalesDeliveryResponse(dto: SalesDeliveryResponseDto): {
  readonly delivery: SalesDelivery;
  readonly lines: readonly SalesDeliveryLine[];
} {
  return {
    delivery: {
      id: dto.id,
      deliveryNumber: dto.deliveryNumber,
      salesOrderId: dto.salesOrderId,
      salesOrderNumber: dto.salesOrderNumber,
      customerId: dto.customerId,
      customerCode: dto.customerCode,
      customerName: dto.customerName,
      statusCode: dto.statusCode,
      statusLabel: dto.statusLabel,
      deliveryDate: parseDate(dto.deliveryDate),
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
    },
    lines: dto.lines.map((line) => ({
      id: line.id,
      salesDeliveryId: line.salesDeliveryId,
      lineNumber: line.lineNumber,
      salesOrderLineId: line.salesOrderLineId,
      productId: line.productId,
      productSku: line.productSku,
      productName: line.productName,
      shippedQuantity: Number(line.shippedQuantity),
      unitCode: line.unitCode,
      unitLabel: line.unitLabel,
      storageLocationId: line.storageLocationId,
      storageLocationCode: line.storageLocationCode,
      storageLocationName: line.storageLocationName,
      inventoryMovementId: line.inventoryMovementId,
      notes: line.notes
    }))
  };
}

function parseNullableDate(value: string | null): Date | null {
  return value ? parseDate(value) : null;
}

function parseDate(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid sales delivery date received from API.');
  }

  return date;
}
