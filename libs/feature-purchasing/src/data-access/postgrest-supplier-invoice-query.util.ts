import type { ApiRequestParamValue } from '@daqiq/core';

import type { SupplierInvoiceLine } from '../models/supplier-invoice-line.model';
import type { SupplierInvoiceQuery } from '../models/supplier-invoice-query.model';
import type { SupplierInvoice } from '../models/supplier-invoice.model';

export interface PostgrestSupplierInvoiceListRequest {
  readonly params: Readonly<Record<string, ApiRequestParamValue | undefined>>;
  readonly range: string;
  readonly page: number;
  readonly pageSize: number;
}

export const SUPPLIER_INVOICE_SELECT_COLUMNS =
  'id,invoice_number,supplier_invoice_number,supplier_id,supplier_code,supplier_name,purchase_order_id,purchase_order_number,goods_receipt_id,goods_receipt_number,status_lookup_value_id,status_code,status_label,invoice_date,due_date,currency_lookup_value_id,currency_code,currency_label,subtotal_amount,tax_amount,total_amount,notes,created_by_email,posted_by_email,posted_at,cancelled_by_email,cancelled_at,created_at,updated_at';

export const SUPPLIER_INVOICE_LINE_SELECT_COLUMNS =
  'id,supplier_invoice_id,line_number,goods_receipt_line_id,purchase_order_line_id,product_id,product_sku,product_name,description,quantity,unit_code,unit_label,unit_price,tax_rate_code,tax_rate_label,tax_amount,line_total';

export const GOODS_RECEIPT_SUPPLIER_INVOICING_PROGRESS_SELECT_COLUMNS =
  'goods_receipt_line_id,goods_receipt_id,purchase_order_line_id,product_id,product_sku,product_name,received_quantity,invoiced_quantity,remaining_quantity,unit_lookup_value_id,unit_code,unit_label';

const INVOICE_SORT_FIELD_MAP = {
  id: 'id',
  invoiceNumber: 'invoice_number',
  supplierInvoiceNumber: 'supplier_invoice_number',
  supplierId: 'supplier_id',
  supplierCode: 'supplier_code',
  supplierName: 'supplier_name',
  purchaseOrderId: 'purchase_order_id',
  purchaseOrderNumber: 'purchase_order_number',
  goodsReceiptId: 'goods_receipt_id',
  goodsReceiptNumber: 'goods_receipt_number',
  statusCode: 'status_code',
  statusLabel: 'status_label',
  invoiceDate: 'invoice_date',
  dueDate: 'due_date',
  currencyLookupValueId: 'currency_lookup_value_id',
  currencyCode: 'currency_code',
  currencyLabel: 'currency_label',
  subtotalAmount: 'subtotal_amount',
  taxAmount: 'tax_amount',
  totalAmount: 'total_amount',
  notes: 'notes',
  createdByEmail: 'created_by_email',
  postedByEmail: 'posted_by_email',
  postedAt: 'posted_at',
  cancelledByEmail: 'cancelled_by_email',
  cancelledAt: 'cancelled_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
} satisfies Record<keyof SupplierInvoice, string>;

const INVOICE_LINE_SORT_FIELD_MAP = {
  id: 'id',
  supplierInvoiceId: 'supplier_invoice_id',
  lineNumber: 'line_number',
  goodsReceiptLineId: 'goods_receipt_line_id',
  purchaseOrderLineId: 'purchase_order_line_id',
  productId: 'product_id',
  productSku: 'product_sku',
  productName: 'product_name',
  description: 'description',
  quantity: 'quantity',
  unitCode: 'unit_code',
  unitLabel: 'unit_label',
  unitPrice: 'unit_price',
  taxRateCode: 'tax_rate_code',
  taxRateLabel: 'tax_rate_label',
  taxAmount: 'tax_amount',
  lineTotal: 'line_total'
} satisfies Record<keyof SupplierInvoiceLine, string>;

export function buildSupplierInvoiceListRequest(
  query?: SupplierInvoiceQuery
): PostgrestSupplierInvoiceListRequest {
  const page = Math.max(0, query?.page ?? 0);
  const pageSize = Math.max(1, query?.pageSize ?? 20);
  const start = page * pageSize;
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: SUPPLIER_INVOICE_SELECT_COLUMNS,
    order: buildSupplierInvoiceOrderParam(query)
  };

  if (query?.supplierId) {
    params['supplier_id'] = `eq.${query.supplierId}`;
  }

  if (query?.purchaseOrderId) {
    params['purchase_order_id'] = `eq.${query.purchaseOrderId}`;
  }

  if (query?.goodsReceiptId) {
    params['goods_receipt_id'] = `eq.${query.goodsReceiptId}`;
  }

  if (query?.statusCode) {
    params['status_code'] = `eq.${query.statusCode}`;
  }

  if (query?.invoiceDateFrom) {
    params['invoice_date'] = `gte.${query.invoiceDateFrom}`;
  }

  if (query?.invoiceDateTo) {
    params['invoice_date'] = params['invoice_date']
      ? [`${params['invoice_date']}`, `lte.${query.invoiceDateTo}`]
      : `lte.${query.invoiceDateTo}`;
  }

  const search = normalizeSearchTerm(query?.search);

  if (search) {
    params['or'] = [
      `invoice_number.ilike.*${search}*`,
      `supplier_invoice_number.ilike.*${search}*`,
      `supplier_code.ilike.*${search}*`,
      `supplier_name.ilike.*${search}*`,
      `purchase_order_number.ilike.*${search}*`,
      `goods_receipt_number.ilike.*${search}*`
    ].join(',');
  }

  return {
    params,
    range: `${start}-${start + pageSize - 1}`,
    page,
    pageSize
  };
}

export function buildSupplierInvoiceIdParams(
  id: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  assertUuid(id, 'Supplier invoice id must be a valid UUID.');

  return {
    select: SUPPLIER_INVOICE_SELECT_COLUMNS,
    id: `eq.${id}`
  };
}

export function buildSupplierInvoiceLineParams(
  supplierInvoiceId: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  assertUuid(supplierInvoiceId, 'Supplier invoice id must be a valid UUID.');

  return {
    select: SUPPLIER_INVOICE_LINE_SELECT_COLUMNS,
    supplier_invoice_id: `eq.${supplierInvoiceId}`,
    order: `${INVOICE_LINE_SORT_FIELD_MAP.lineNumber}.asc`
  };
}

export function buildGoodsReceiptSupplierInvoicingProgressParams(
  goodsReceiptId: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  assertUuid(goodsReceiptId, 'Goods receipt id must be a valid UUID.');

  return {
    select: GOODS_RECEIPT_SUPPLIER_INVOICING_PROGRESS_SELECT_COLUMNS,
    goods_receipt_id: `eq.${goodsReceiptId}`,
    order: 'product_name.asc'
  };
}

function buildSupplierInvoiceOrderParam(query?: SupplierInvoiceQuery): string {
  const field = query?.sortField ? INVOICE_SORT_FIELD_MAP[query.sortField] : 'invoice_date';
  const direction = query?.sortDirection ?? 'desc';
  return `${field}.${direction},id.desc`;
}

function normalizeSearchTerm(value: string | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? escapePostgrestIlikeTerm(normalized) : null;
}

function escapePostgrestIlikeTerm(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/%/g, '\\%')
    .replace(/,/g, '\\,')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function assertUuid(value: string, message: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value)) {
    throw new Error(message);
  }
}
