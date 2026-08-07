import type { ApiRequestParamValue } from '@daqiq/core';

import type { SalesInvoiceLine } from '../models/sales-invoice-line.model';
import type { SalesInvoiceQuery } from '../models/sales-invoice-query.model';
import type { SalesInvoice } from '../models/sales-invoice.model';

export interface PostgrestInvoiceListRequest {
  readonly params: Readonly<Record<string, ApiRequestParamValue | undefined>>;
  readonly range: string;
  readonly page: number;
  readonly pageSize: number;
}

export const SALES_INVOICE_SELECT_COLUMNS =
  'id,invoice_number,customer_id,customer_code,customer_name,sales_order_id,sales_order_number,sales_delivery_id,sales_delivery_number,status_lookup_value_id,status_code,status_label,invoice_date,due_date,currency_lookup_value_id,currency_code,currency_label,subtotal_amount,tax_amount,total_amount,notes,created_by_email,issued_by_email,issued_at,cancelled_by_email,cancelled_at,created_at,updated_at';

export const SALES_INVOICE_LINE_SELECT_COLUMNS =
  'id,sales_invoice_id,line_number,sales_delivery_line_id,sales_order_line_id,product_id,product_sku,product_name,description,quantity,unit_code,unit_label,unit_price,tax_rate_code,tax_rate_label,tax_amount,line_total';

export const SALES_DELIVERY_INVOICING_PROGRESS_SELECT_COLUMNS =
  'sales_delivery_line_id,sales_delivery_id,sales_order_line_id,product_id,product_sku,product_name,delivered_quantity,invoiced_quantity,remaining_quantity,unit_lookup_value_id,unit_code,unit_label';

const INVOICE_SORT_FIELD_MAP = {
  id: 'id',
  invoiceNumber: 'invoice_number',
  customerId: 'customer_id',
  customerCode: 'customer_code',
  customerName: 'customer_name',
  salesOrderId: 'sales_order_id',
  salesOrderNumber: 'sales_order_number',
  salesDeliveryId: 'sales_delivery_id',
  salesDeliveryNumber: 'sales_delivery_number',
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
  issuedByEmail: 'issued_by_email',
  issuedAt: 'issued_at',
  cancelledByEmail: 'cancelled_by_email',
  cancelledAt: 'cancelled_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
} satisfies Record<keyof SalesInvoice, string>;

const INVOICE_LINE_SORT_FIELD_MAP = {
  id: 'id',
  salesInvoiceId: 'sales_invoice_id',
  lineNumber: 'line_number',
  salesDeliveryLineId: 'sales_delivery_line_id',
  salesOrderLineId: 'sales_order_line_id',
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
} satisfies Record<keyof SalesInvoiceLine, string>;

export function buildSalesInvoiceListRequest(
  query?: SalesInvoiceQuery
): PostgrestInvoiceListRequest {
  const page = Math.max(0, query?.page ?? 0);
  const pageSize = Math.max(1, query?.pageSize ?? 20);
  const start = page * pageSize;
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: SALES_INVOICE_SELECT_COLUMNS,
    order: buildSalesInvoiceOrderParam(query)
  };

  if (query?.customerId) {
    params['customer_id'] = `eq.${query.customerId}`;
  }

  if (query?.salesOrderId) {
    params['sales_order_id'] = `eq.${query.salesOrderId}`;
  }

  if (query?.salesDeliveryId) {
    params['sales_delivery_id'] = `eq.${query.salesDeliveryId}`;
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
      `customer_code.ilike.*${search}*`,
      `customer_name.ilike.*${search}*`,
      `sales_order_number.ilike.*${search}*`,
      `sales_delivery_number.ilike.*${search}*`
    ].join(',');
  }

  return {
    params,
    range: `${start}-${start + pageSize - 1}`,
    page,
    pageSize
  };
}

export function buildSalesInvoiceIdParams(
  id: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  assertUuid(id, 'Sales invoice id must be a valid UUID.');

  return {
    select: SALES_INVOICE_SELECT_COLUMNS,
    id: `eq.${id}`
  };
}

export function buildSalesInvoiceLineParams(
  salesInvoiceId: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  assertUuid(salesInvoiceId, 'Sales invoice id must be a valid UUID.');

  return {
    select: SALES_INVOICE_LINE_SELECT_COLUMNS,
    sales_invoice_id: `eq.${salesInvoiceId}`,
    order: `${INVOICE_LINE_SORT_FIELD_MAP.lineNumber}.asc`
  };
}

export function buildSalesDeliveryInvoicingProgressParams(
  salesDeliveryId: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  assertUuid(salesDeliveryId, 'Sales delivery id must be a valid UUID.');

  return {
    select: SALES_DELIVERY_INVOICING_PROGRESS_SELECT_COLUMNS,
    sales_delivery_id: `eq.${salesDeliveryId}`,
    order: 'product_name.asc'
  };
}

function buildSalesInvoiceOrderParam(query?: SalesInvoiceQuery): string {
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
