import type { SalesDeliveryLineInvoicingProgressRowDto } from '../dto/sales-delivery-line-invoicing-progress-row.dto';
import type { SalesInvoiceLineRowDto } from '../dto/sales-invoice-line-row.dto';
import type { SalesInvoiceResponseDto } from '../dto/sales-invoice-response.dto';
import type { SalesInvoiceRowDto } from '../dto/sales-invoice-row.dto';
import type { SalesDeliveryLineInvoicingProgress } from '../models/sales-delivery-line-invoicing-progress.model';
import type { SalesInvoiceLine } from '../models/sales-invoice-line.model';
import type { SalesInvoice } from '../models/sales-invoice.model';

export function mapSalesInvoiceRow(row: SalesInvoiceRowDto): SalesInvoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    customerId: row.customer_id,
    customerCode: row.customer_code,
    customerName: row.customer_name,
    salesOrderId: row.sales_order_id,
    salesOrderNumber: row.sales_order_number,
    salesDeliveryId: row.sales_delivery_id,
    salesDeliveryNumber: row.sales_delivery_number,
    statusCode: row.status_code,
    statusLabel: row.status_label,
    invoiceDate: parseDate(row.invoice_date),
    dueDate: parseNullableDate(row.due_date),
    currencyLookupValueId: row.currency_lookup_value_id,
    currencyCode: row.currency_code,
    currencyLabel: row.currency_label,
    subtotalAmount: Number(row.subtotal_amount),
    taxAmount: Number(row.tax_amount),
    totalAmount: Number(row.total_amount),
    notes: row.notes,
    createdByEmail: row.created_by_email,
    issuedByEmail: row.issued_by_email,
    issuedAt: parseNullableDate(row.issued_at),
    cancelledByEmail: row.cancelled_by_email,
    cancelledAt: parseNullableDate(row.cancelled_at),
    createdAt: parseDate(row.created_at),
    updatedAt: parseDate(row.updated_at)
  };
}

export function mapSalesInvoiceLineRow(row: SalesInvoiceLineRowDto): SalesInvoiceLine {
  return {
    id: row.id,
    salesInvoiceId: row.sales_invoice_id,
    lineNumber: row.line_number,
    salesDeliveryLineId: row.sales_delivery_line_id,
    salesOrderLineId: row.sales_order_line_id,
    productId: row.product_id,
    productSku: row.product_sku,
    productName: row.product_name,
    description: row.description,
    quantity: Number(row.quantity),
    unitCode: row.unit_code,
    unitLabel: row.unit_label,
    unitPrice: Number(row.unit_price),
    taxRateCode: row.tax_rate_code,
    taxRateLabel: row.tax_rate_label,
    taxAmount: Number(row.tax_amount),
    lineTotal: Number(row.line_total)
  };
}

export function mapSalesDeliveryLineInvoicingProgressRow(
  row: SalesDeliveryLineInvoicingProgressRowDto
): SalesDeliveryLineInvoicingProgress {
  return {
    salesDeliveryLineId: row.sales_delivery_line_id,
    salesDeliveryId: row.sales_delivery_id,
    salesOrderLineId: row.sales_order_line_id,
    productId: row.product_id,
    productSku: row.product_sku,
    productName: row.product_name,
    deliveredQuantity: Number(row.delivered_quantity),
    invoicedQuantity: Number(row.invoiced_quantity),
    remainingQuantity: Number(row.remaining_quantity),
    unitLookupValueId: row.unit_lookup_value_id,
    unitCode: row.unit_code,
    unitLabel: row.unit_label
  };
}

export function mapSalesInvoiceResponse(dto: SalesInvoiceResponseDto): {
  readonly invoice: SalesInvoice;
  readonly lines: readonly SalesInvoiceLine[];
} {
  return {
    invoice: {
      id: dto.id,
      invoiceNumber: dto.invoiceNumber,
      customerId: dto.customerId,
      customerCode: dto.customerCode,
      customerName: dto.customerName,
      salesOrderId: dto.salesOrderId,
      salesOrderNumber: dto.salesOrderNumber,
      salesDeliveryId: dto.salesDeliveryId,
      salesDeliveryNumber: dto.salesDeliveryNumber,
      statusCode: dto.statusCode,
      statusLabel: dto.statusLabel,
      invoiceDate: parseDate(dto.invoiceDate),
      dueDate: parseNullableDate(dto.dueDate),
      currencyLookupValueId: dto.currencyLookupValueId,
      currencyCode: dto.currencyCode,
      currencyLabel: dto.currencyLabel,
      subtotalAmount: Number(dto.subtotalAmount),
      taxAmount: Number(dto.taxAmount),
      totalAmount: Number(dto.totalAmount),
      notes: dto.notes,
      createdByEmail: dto.createdByEmail,
      issuedByEmail: dto.issuedByEmail,
      issuedAt: parseNullableDate(dto.issuedAt),
      cancelledByEmail: dto.cancelledByEmail,
      cancelledAt: parseNullableDate(dto.cancelledAt),
      createdAt: parseDate(dto.createdAt),
      updatedAt: parseDate(dto.updatedAt)
    },
    lines: dto.lines.map((line) => ({
      id: line.id,
      salesInvoiceId: line.salesInvoiceId,
      lineNumber: line.lineNumber,
      salesDeliveryLineId: line.salesDeliveryLineId,
      salesOrderLineId: line.salesOrderLineId,
      productId: line.productId,
      productSku: line.productSku,
      productName: line.productName,
      description: line.description,
      quantity: Number(line.quantity),
      unitCode: line.unitCode,
      unitLabel: line.unitLabel,
      unitPrice: Number(line.unitPrice),
      taxRateCode: line.taxRateCode,
      taxRateLabel: line.taxRateLabel,
      taxAmount: Number(line.taxAmount),
      lineTotal: Number(line.lineTotal)
    }))
  };
}

function parseNullableDate(value: string | null): Date | null {
  return value ? parseDate(value) : null;
}

function parseDate(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid sales invoice date received from API.');
  }

  return date;
}
