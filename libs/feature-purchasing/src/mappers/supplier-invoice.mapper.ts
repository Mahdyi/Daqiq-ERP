import type { GoodsReceiptLineSupplierInvoicingProgressRowDto } from '../dto/goods-receipt-line-supplier-invoicing-progress-row.dto';
import type { SupplierInvoiceLineRowDto } from '../dto/supplier-invoice-line-row.dto';
import type { SupplierInvoiceResponseDto } from '../dto/supplier-invoice-response.dto';
import type { SupplierInvoiceRowDto } from '../dto/supplier-invoice-row.dto';
import type { GoodsReceiptLineSupplierInvoicingProgress } from '../models/goods-receipt-line-supplier-invoicing-progress.model';
import type { SupplierInvoiceLine } from '../models/supplier-invoice-line.model';
import type { SupplierInvoice } from '../models/supplier-invoice.model';

export function mapSupplierInvoiceRow(row: SupplierInvoiceRowDto): SupplierInvoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    supplierInvoiceNumber: row.supplier_invoice_number,
    supplierId: row.supplier_id,
    supplierCode: row.supplier_code,
    supplierName: row.supplier_name,
    purchaseOrderId: row.purchase_order_id,
    purchaseOrderNumber: row.purchase_order_number,
    goodsReceiptId: row.goods_receipt_id,
    goodsReceiptNumber: row.goods_receipt_number,
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
    postedByEmail: row.posted_by_email,
    postedAt: parseNullableDate(row.posted_at),
    cancelledByEmail: row.cancelled_by_email,
    cancelledAt: parseNullableDate(row.cancelled_at),
    createdAt: parseDate(row.created_at),
    updatedAt: parseDate(row.updated_at)
  };
}

export function mapSupplierInvoiceLineRow(row: SupplierInvoiceLineRowDto): SupplierInvoiceLine {
  return {
    id: row.id,
    supplierInvoiceId: row.supplier_invoice_id,
    lineNumber: row.line_number,
    goodsReceiptLineId: row.goods_receipt_line_id,
    purchaseOrderLineId: row.purchase_order_line_id,
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

export function mapGoodsReceiptLineSupplierInvoicingProgressRow(
  row: GoodsReceiptLineSupplierInvoicingProgressRowDto
): GoodsReceiptLineSupplierInvoicingProgress {
  return {
    goodsReceiptLineId: row.goods_receipt_line_id,
    goodsReceiptId: row.goods_receipt_id,
    purchaseOrderLineId: row.purchase_order_line_id,
    productId: row.product_id,
    productSku: row.product_sku,
    productName: row.product_name,
    receivedQuantity: Number(row.received_quantity),
    invoicedQuantity: Number(row.invoiced_quantity),
    remainingQuantity: Number(row.remaining_quantity),
    unitLookupValueId: row.unit_lookup_value_id,
    unitCode: row.unit_code,
    unitLabel: row.unit_label
  };
}

export function mapSupplierInvoiceResponse(dto: SupplierInvoiceResponseDto): {
  readonly invoice: SupplierInvoice;
  readonly lines: readonly SupplierInvoiceLine[];
} {
  return {
    invoice: {
      id: dto.id,
      invoiceNumber: dto.invoiceNumber,
      supplierInvoiceNumber: dto.supplierInvoiceNumber,
      supplierId: dto.supplierId,
      supplierCode: dto.supplierCode,
      supplierName: dto.supplierName,
      purchaseOrderId: dto.purchaseOrderId,
      purchaseOrderNumber: dto.purchaseOrderNumber,
      goodsReceiptId: dto.goodsReceiptId,
      goodsReceiptNumber: dto.goodsReceiptNumber,
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
      postedByEmail: dto.postedByEmail,
      postedAt: parseNullableDate(dto.postedAt),
      cancelledByEmail: dto.cancelledByEmail,
      cancelledAt: parseNullableDate(dto.cancelledAt),
      createdAt: parseDate(dto.createdAt),
      updatedAt: parseDate(dto.updatedAt)
    },
    lines: dto.lines.map((line) => ({
      id: line.id,
      supplierInvoiceId: line.supplierInvoiceId,
      lineNumber: line.lineNumber,
      goodsReceiptLineId: line.goodsReceiptLineId,
      purchaseOrderLineId: line.purchaseOrderLineId,
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
    throw new Error('Invalid supplier invoice date received from API.');
  }

  return date;
}
