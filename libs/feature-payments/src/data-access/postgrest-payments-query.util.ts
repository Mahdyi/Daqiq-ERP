import type { ApiRequestParamValue } from '@daqiq/core';

import type { CashBankAccount } from '../models/cash-bank-account.model';
import type { CustomerReceipt } from '../models/customer-receipt.model';
import type { PaymentListQuery, SettlementQuery } from '../models/payment-query.model';
import type { SalesInvoiceSettlement, SupplierInvoiceSettlement } from '../models/settlement.model';
import type { SupplierPayment } from '../models/supplier-payment.model';

export interface PostgrestListRequest {
  readonly params: Readonly<Record<string, ApiRequestParamValue | undefined>>;
  readonly range: string;
  readonly page: number;
  readonly pageSize: number;
}

export const CASH_BANK_ACCOUNT_SELECT =
  'id,account_code,account_name,account_type_lookup_value_id,account_type_code,account_type_label,currency_lookup_value_id,currency_code,currency_label,gl_account_id,gl_account_code,gl_account_name,bank_name,iban,account_number,description,active,created_at,updated_at';

export const CUSTOMER_RECEIPT_SELECT =
  'id,receipt_number,customer_id,customer_code,customer_name,cash_bank_account_id,cash_bank_account_code,cash_bank_account_name,status_code,status_label,payment_method_code,payment_method_label,receipt_date,currency_code,currency_label,amount,reference_number,notes,journal_entry_id,journal_number,posted_by_email,posted_at,cancelled_by_email,cancelled_at,created_by_email,created_at,updated_at';

export const SUPPLIER_PAYMENT_SELECT =
  'id,payment_number,supplier_id,supplier_code,supplier_name,cash_bank_account_id,cash_bank_account_code,cash_bank_account_name,status_code,status_label,payment_method_code,payment_method_label,payment_date,currency_code,currency_label,amount,reference_number,notes,journal_entry_id,journal_number,posted_by_email,posted_at,cancelled_by_email,cancelled_at,created_by_email,created_at,updated_at';

export const CUSTOMER_RECEIPT_ALLOCATION_SELECT =
  'id,customer_receipt_id,sales_invoice_id,invoice_number,line_number,allocated_amount';

export const SUPPLIER_PAYMENT_ALLOCATION_SELECT =
  'id,supplier_payment_id,supplier_invoice_id,invoice_number,supplier_invoice_number,line_number,allocated_amount';

export const SALES_SETTLEMENT_SELECT =
  'sales_invoice_id,invoice_number,customer_id,customer_code,customer_name,invoice_date,due_date,total_amount,paid_amount,remaining_amount,settlement_status';

export const SUPPLIER_SETTLEMENT_SELECT =
  'supplier_invoice_id,invoice_number,supplier_invoice_number,supplier_id,supplier_code,supplier_name,invoice_date,due_date,total_amount,paid_amount,remaining_amount,settlement_status';

const CASH_BANK_SORT = {
  id: 'id',
  accountCode: 'account_code',
  accountName: 'account_name',
  accountTypeLookupValueId: 'account_type_lookup_value_id',
  accountTypeCode: 'account_type_code',
  accountTypeLabel: 'account_type_label',
  currencyLookupValueId: 'currency_lookup_value_id',
  currencyCode: 'currency_code',
  currencyLabel: 'currency_label',
  glAccountId: 'gl_account_id',
  glAccountCode: 'gl_account_code',
  glAccountName: 'gl_account_name',
  bankName: 'bank_name',
  iban: 'iban',
  accountNumber: 'account_number',
  description: 'description',
  active: 'active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
} satisfies Record<keyof CashBankAccount, string>;

const CUSTOMER_RECEIPT_SORT = {
  id: 'id',
  receiptNumber: 'receipt_number',
  customerId: 'customer_id',
  customerCode: 'customer_code',
  customerName: 'customer_name',
  cashBankAccountId: 'cash_bank_account_id',
  cashBankAccountCode: 'cash_bank_account_code',
  cashBankAccountName: 'cash_bank_account_name',
  statusCode: 'status_code',
  statusLabel: 'status_label',
  paymentMethodCode: 'payment_method_code',
  paymentMethodLabel: 'payment_method_label',
  receiptDate: 'receipt_date',
  currencyCode: 'currency_code',
  currencyLabel: 'currency_label',
  amount: 'amount',
  referenceNumber: 'reference_number',
  notes: 'notes',
  journalEntryId: 'journal_entry_id',
  journalNumber: 'journal_number',
  postedByEmail: 'posted_by_email',
  postedAt: 'posted_at',
  cancelledByEmail: 'cancelled_by_email',
  cancelledAt: 'cancelled_at',
  createdByEmail: 'created_by_email',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
} satisfies Record<keyof CustomerReceipt, string>;

const SUPPLIER_PAYMENT_SORT = {
  id: 'id',
  paymentNumber: 'payment_number',
  supplierId: 'supplier_id',
  supplierCode: 'supplier_code',
  supplierName: 'supplier_name',
  cashBankAccountId: 'cash_bank_account_id',
  cashBankAccountCode: 'cash_bank_account_code',
  cashBankAccountName: 'cash_bank_account_name',
  statusCode: 'status_code',
  statusLabel: 'status_label',
  paymentMethodCode: 'payment_method_code',
  paymentMethodLabel: 'payment_method_label',
  paymentDate: 'payment_date',
  currencyCode: 'currency_code',
  currencyLabel: 'currency_label',
  amount: 'amount',
  referenceNumber: 'reference_number',
  notes: 'notes',
  journalEntryId: 'journal_entry_id',
  journalNumber: 'journal_number',
  postedByEmail: 'posted_by_email',
  postedAt: 'posted_at',
  cancelledByEmail: 'cancelled_by_email',
  cancelledAt: 'cancelled_at',
  createdByEmail: 'created_by_email',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
} satisfies Record<keyof SupplierPayment, string>;

const SALES_SETTLEMENT_SORT = {
  salesInvoiceId: 'sales_invoice_id',
  invoiceNumber: 'invoice_number',
  customerId: 'customer_id',
  customerCode: 'customer_code',
  customerName: 'customer_name',
  invoiceDate: 'invoice_date',
  dueDate: 'due_date',
  totalAmount: 'total_amount',
  paidAmount: 'paid_amount',
  remainingAmount: 'remaining_amount',
  settlementStatus: 'settlement_status'
} satisfies Record<keyof SalesInvoiceSettlement, string>;

const SUPPLIER_SETTLEMENT_SORT = {
  supplierInvoiceId: 'supplier_invoice_id',
  invoiceNumber: 'invoice_number',
  supplierInvoiceNumber: 'supplier_invoice_number',
  supplierId: 'supplier_id',
  supplierCode: 'supplier_code',
  supplierName: 'supplier_name',
  invoiceDate: 'invoice_date',
  dueDate: 'due_date',
  totalAmount: 'total_amount',
  paidAmount: 'paid_amount',
  remainingAmount: 'remaining_amount',
  settlementStatus: 'settlement_status'
} satisfies Record<keyof SupplierInvoiceSettlement, string>;

export function buildCashBankAccountListRequest(query?: PaymentListQuery): PostgrestListRequest {
  const request = buildPage(query?.page, query?.pageSize);
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: CASH_BANK_ACCOUNT_SELECT,
    order: `${resolveSort(CASH_BANK_SORT, query?.sortField, 'account_code')}.${query?.sortDirection ?? 'asc'},id.asc`
  };

  const search = normalizeSearch(query?.search);
  if (search) {
    params['or'] = [`account_code.ilike.*${search}*`, `account_name.ilike.*${search}*`].join(',');
  }

  return { ...request, params };
}

export function buildCustomerReceiptListRequest(query?: PaymentListQuery): PostgrestListRequest {
  const request = buildPage(query?.page, query?.pageSize);
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: CUSTOMER_RECEIPT_SELECT,
    order: `${resolveSort(CUSTOMER_RECEIPT_SORT, query?.sortField, 'receipt_date')}.${query?.sortDirection ?? 'desc'},id.desc`
  };

  const search = normalizeSearch(query?.search);
  if (search) {
    params['or'] = [
      `receipt_number.ilike.*${search}*`,
      `customer_name.ilike.*${search}*`,
      `cash_bank_account_name.ilike.*${search}*`,
      `journal_number.ilike.*${search}*`
    ].join(',');
  }

  return { ...request, params };
}

export function buildSupplierPaymentListRequest(query?: PaymentListQuery): PostgrestListRequest {
  const request = buildPage(query?.page, query?.pageSize);
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: SUPPLIER_PAYMENT_SELECT,
    order: `${resolveSort(SUPPLIER_PAYMENT_SORT, query?.sortField, 'payment_date')}.${query?.sortDirection ?? 'desc'},id.desc`
  };

  const search = normalizeSearch(query?.search);
  if (search) {
    params['or'] = [
      `payment_number.ilike.*${search}*`,
      `supplier_name.ilike.*${search}*`,
      `cash_bank_account_name.ilike.*${search}*`,
      `journal_number.ilike.*${search}*`
    ].join(',');
  }

  return { ...request, params };
}

export function buildSalesSettlementListRequest(query?: SettlementQuery): PostgrestListRequest {
  const request = buildPage(query?.page, query?.pageSize);
  const params = buildSettlementParams(
    SALES_SETTLEMENT_SELECT,
    SALES_SETTLEMENT_SORT,
    query,
    'invoice_date',
    ['invoice_number', 'customer_name', 'customer_code']
  );
  return { ...request, params };
}

export function buildSupplierSettlementListRequest(query?: SettlementQuery): PostgrestListRequest {
  const request = buildPage(query?.page, query?.pageSize);
  const params = buildSettlementParams(
    SUPPLIER_SETTLEMENT_SELECT,
    SUPPLIER_SETTLEMENT_SORT,
    query,
    'invoice_date',
    ['invoice_number', 'supplier_invoice_number', 'supplier_name', 'supplier_code']
  );
  return { ...request, params };
}

export function buildIdParams(
  select: string,
  idField: string,
  id: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  assertUuid(id);

  return {
    select,
    [idField]: `eq.${id}`
  };
}

function buildSettlementParams(
  select: string,
  sortMap: Readonly<Record<string, string>>,
  query: SettlementQuery | undefined,
  defaultSort: string,
  searchFields: readonly string[]
): Record<string, ApiRequestParamValue | undefined> {
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select,
    order: `${resolveSort(sortMap, query?.sortField, defaultSort)}.${query?.sortDirection ?? 'desc'}`
  };

  if (query?.settlementStatus) {
    params['settlement_status'] = `eq.${query.settlementStatus}`;
  }

  const search = normalizeSearch(query?.search);
  if (search) {
    params['or'] = searchFields.map((field) => `${field}.ilike.*${search}*`).join(',');
  }

  return params;
}

function buildPage(page: number | undefined, pageSize: number | undefined): Omit<PostgrestListRequest, 'params'> {
  const resolvedPage = Math.max(0, page ?? 0);
  const resolvedPageSize = Math.max(1, pageSize ?? 20);
  const start = resolvedPage * resolvedPageSize;

  return {
    range: `${start}-${start + resolvedPageSize - 1}`,
    page: resolvedPage,
    pageSize: resolvedPageSize
  };
}

function resolveSort(
  sortMap: Readonly<Record<string, string>>,
  sortField: string | undefined,
  fallback: string
): string {
  return sortField ? sortMap[sortField] ?? fallback : fallback;
}

function normalizeSearch(value: string | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized ? escapePostgrestIlikeTerm(normalized) : null;
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

function assertUuid(value: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value)) {
    throw new Error('Payment identifier must be a valid UUID.');
  }
}
