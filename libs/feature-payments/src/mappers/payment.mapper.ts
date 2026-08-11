import type {
  CustomerReceiptResponseAllocationDto,
  CustomerReceiptResponseDto,
  SupplierPaymentResponseAllocationDto,
  SupplierPaymentResponseDto
} from '../dto/payment-command.dto';
import type {
  CashBankAccountRowDto,
  CustomerReceiptAllocationRowDto,
  CustomerReceiptRowDto,
  SupplierPaymentAllocationRowDto,
  SupplierPaymentRowDto
} from '../dto/payment-row.dto';
import type {
  SalesInvoiceSettlementRowDto,
  SupplierInvoiceSettlementRowDto
} from '../dto/settlement-row.dto';
import type { CashBankAccount } from '../models/cash-bank-account.model';
import type { CustomerReceipt, CustomerReceiptAllocation } from '../models/customer-receipt.model';
import type {
  SalesInvoiceSettlement,
  SupplierInvoiceSettlement
} from '../models/settlement.model';
import type { SupplierPayment, SupplierPaymentAllocation } from '../models/supplier-payment.model';

export function mapCashBankAccountRow(row: CashBankAccountRowDto): CashBankAccount {
  return {
    id: row.id,
    accountCode: row.account_code,
    accountName: row.account_name,
    accountTypeLookupValueId: row.account_type_lookup_value_id,
    accountTypeCode: row.account_type_code,
    accountTypeLabel: row.account_type_label,
    currencyLookupValueId: row.currency_lookup_value_id,
    currencyCode: row.currency_code,
    currencyLabel: row.currency_label,
    glAccountId: row.gl_account_id,
    glAccountCode: row.gl_account_code,
    glAccountName: row.gl_account_name,
    bankName: row.bank_name,
    iban: row.iban,
    accountNumber: row.account_number,
    description: row.description,
    active: row.active,
    createdAt: parseDate(row.created_at, 'Cash/bank created date'),
    updatedAt: parseDate(row.updated_at, 'Cash/bank updated date')
  };
}

export function mapCustomerReceiptRow(row: CustomerReceiptRowDto): CustomerReceipt {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    customerId: row.customer_id,
    customerCode: row.customer_code,
    customerName: row.customer_name,
    cashBankAccountId: row.cash_bank_account_id,
    cashBankAccountCode: row.cash_bank_account_code,
    cashBankAccountName: row.cash_bank_account_name,
    statusCode: row.status_code,
    statusLabel: row.status_label,
    paymentMethodCode: row.payment_method_code,
    paymentMethodLabel: row.payment_method_label,
    receiptDate: parseDate(row.receipt_date, 'Customer receipt date'),
    currencyCode: row.currency_code,
    currencyLabel: row.currency_label,
    amount: parseNumber(row.amount, 'Customer receipt amount'),
    referenceNumber: row.reference_number,
    notes: row.notes,
    journalEntryId: row.journal_entry_id,
    journalNumber: row.journal_number,
    postedByEmail: row.posted_by_email,
    postedAt: parseNullableDate(row.posted_at, 'Customer receipt posted date'),
    cancelledByEmail: row.cancelled_by_email,
    cancelledAt: parseNullableDate(row.cancelled_at, 'Customer receipt cancelled date'),
    createdByEmail: row.created_by_email,
    createdAt: parseDate(row.created_at, 'Customer receipt created date'),
    updatedAt: parseDate(row.updated_at, 'Customer receipt updated date')
  };
}

export function mapCustomerReceiptAllocationRow(
  row: CustomerReceiptAllocationRowDto
): CustomerReceiptAllocation {
  return {
    id: row.id,
    customerReceiptId: row.customer_receipt_id,
    salesInvoiceId: row.sales_invoice_id,
    invoiceNumber: row.invoice_number,
    lineNumber: row.line_number,
    allocatedAmount: parseNumber(row.allocated_amount, 'Customer receipt allocated amount')
  };
}

export function mapCustomerReceiptResponse(dto: CustomerReceiptResponseDto): CustomerReceipt {
  return {
    id: dto.id,
    receiptNumber: dto.receiptNumber,
    customerId: dto.customerId,
    customerCode: dto.customerCode,
    customerName: dto.customerName,
    cashBankAccountId: dto.cashBankAccountId,
    cashBankAccountCode: dto.cashBankAccountCode,
    cashBankAccountName: dto.cashBankAccountName,
    statusCode: dto.statusCode,
    statusLabel: dto.statusLabel,
    paymentMethodCode: dto.paymentMethodCode,
    paymentMethodLabel: dto.paymentMethodLabel,
    receiptDate: parseDate(dto.receiptDate, 'Customer receipt date'),
    currencyCode: dto.currencyCode,
    currencyLabel: dto.currencyLabel,
    amount: parseNumber(dto.amount, 'Customer receipt amount'),
    referenceNumber: dto.referenceNumber,
    notes: dto.notes,
    journalEntryId: dto.journalEntryId,
    journalNumber: dto.journalNumber,
    postedByEmail: dto.postedByEmail,
    postedAt: parseNullableDate(dto.postedAt, 'Customer receipt posted date'),
    cancelledByEmail: dto.cancelledByEmail,
    cancelledAt: parseNullableDate(dto.cancelledAt, 'Customer receipt cancelled date'),
    createdByEmail: dto.createdByEmail,
    createdAt: parseDate(dto.createdAt, 'Customer receipt created date'),
    updatedAt: parseDate(dto.updatedAt, 'Customer receipt updated date')
  };
}

export function mapCustomerReceiptResponseAllocation(
  dto: CustomerReceiptResponseAllocationDto
): CustomerReceiptAllocation {
  return {
    id: dto.id,
    customerReceiptId: dto.customerReceiptId,
    salesInvoiceId: dto.salesInvoiceId,
    invoiceNumber: dto.invoiceNumber,
    lineNumber: dto.lineNumber,
    allocatedAmount: parseNumber(dto.allocatedAmount, 'Customer receipt allocated amount')
  };
}

export function mapSupplierPaymentRow(row: SupplierPaymentRowDto): SupplierPayment {
  return {
    id: row.id,
    paymentNumber: row.payment_number,
    supplierId: row.supplier_id,
    supplierCode: row.supplier_code,
    supplierName: row.supplier_name,
    cashBankAccountId: row.cash_bank_account_id,
    cashBankAccountCode: row.cash_bank_account_code,
    cashBankAccountName: row.cash_bank_account_name,
    statusCode: row.status_code,
    statusLabel: row.status_label,
    paymentMethodCode: row.payment_method_code,
    paymentMethodLabel: row.payment_method_label,
    paymentDate: parseDate(row.payment_date, 'Supplier payment date'),
    currencyCode: row.currency_code,
    currencyLabel: row.currency_label,
    amount: parseNumber(row.amount, 'Supplier payment amount'),
    referenceNumber: row.reference_number,
    notes: row.notes,
    journalEntryId: row.journal_entry_id,
    journalNumber: row.journal_number,
    postedByEmail: row.posted_by_email,
    postedAt: parseNullableDate(row.posted_at, 'Supplier payment posted date'),
    cancelledByEmail: row.cancelled_by_email,
    cancelledAt: parseNullableDate(row.cancelled_at, 'Supplier payment cancelled date'),
    createdByEmail: row.created_by_email,
    createdAt: parseDate(row.created_at, 'Supplier payment created date'),
    updatedAt: parseDate(row.updated_at, 'Supplier payment updated date')
  };
}

export function mapSupplierPaymentAllocationRow(
  row: SupplierPaymentAllocationRowDto
): SupplierPaymentAllocation {
  return {
    id: row.id,
    supplierPaymentId: row.supplier_payment_id,
    supplierInvoiceId: row.supplier_invoice_id,
    invoiceNumber: row.invoice_number,
    supplierInvoiceNumber: row.supplier_invoice_number,
    lineNumber: row.line_number,
    allocatedAmount: parseNumber(row.allocated_amount, 'Supplier payment allocated amount')
  };
}

export function mapSupplierPaymentResponse(dto: SupplierPaymentResponseDto): SupplierPayment {
  return {
    id: dto.id,
    paymentNumber: dto.paymentNumber,
    supplierId: dto.supplierId,
    supplierCode: dto.supplierCode,
    supplierName: dto.supplierName,
    cashBankAccountId: dto.cashBankAccountId,
    cashBankAccountCode: dto.cashBankAccountCode,
    cashBankAccountName: dto.cashBankAccountName,
    statusCode: dto.statusCode,
    statusLabel: dto.statusLabel,
    paymentMethodCode: dto.paymentMethodCode,
    paymentMethodLabel: dto.paymentMethodLabel,
    paymentDate: parseDate(dto.paymentDate, 'Supplier payment date'),
    currencyCode: dto.currencyCode,
    currencyLabel: dto.currencyLabel,
    amount: parseNumber(dto.amount, 'Supplier payment amount'),
    referenceNumber: dto.referenceNumber,
    notes: dto.notes,
    journalEntryId: dto.journalEntryId,
    journalNumber: dto.journalNumber,
    postedByEmail: dto.postedByEmail,
    postedAt: parseNullableDate(dto.postedAt, 'Supplier payment posted date'),
    cancelledByEmail: dto.cancelledByEmail,
    cancelledAt: parseNullableDate(dto.cancelledAt, 'Supplier payment cancelled date'),
    createdByEmail: dto.createdByEmail,
    createdAt: parseDate(dto.createdAt, 'Supplier payment created date'),
    updatedAt: parseDate(dto.updatedAt, 'Supplier payment updated date')
  };
}

export function mapSupplierPaymentResponseAllocation(
  dto: SupplierPaymentResponseAllocationDto
): SupplierPaymentAllocation {
  return {
    id: dto.id,
    supplierPaymentId: dto.supplierPaymentId,
    supplierInvoiceId: dto.supplierInvoiceId,
    invoiceNumber: dto.invoiceNumber,
    supplierInvoiceNumber: dto.supplierInvoiceNumber,
    lineNumber: dto.lineNumber,
    allocatedAmount: parseNumber(dto.allocatedAmount, 'Supplier payment allocated amount')
  };
}

export function mapSalesInvoiceSettlementRow(
  row: SalesInvoiceSettlementRowDto
): SalesInvoiceSettlement {
  return {
    salesInvoiceId: row.sales_invoice_id,
    invoiceNumber: row.invoice_number,
    customerId: row.customer_id,
    customerCode: row.customer_code,
    customerName: row.customer_name,
    invoiceDate: parseDate(row.invoice_date, 'Sales invoice settlement date'),
    dueDate: parseNullableDate(row.due_date, 'Sales invoice settlement due date'),
    totalAmount: parseNumber(row.total_amount, 'Sales invoice total'),
    paidAmount: parseNumber(row.paid_amount, 'Sales invoice paid amount'),
    remainingAmount: parseNumber(row.remaining_amount, 'Sales invoice remaining amount'),
    settlementStatus: row.settlement_status
  };
}

export function mapSupplierInvoiceSettlementRow(
  row: SupplierInvoiceSettlementRowDto
): SupplierInvoiceSettlement {
  return {
    supplierInvoiceId: row.supplier_invoice_id,
    invoiceNumber: row.invoice_number,
    supplierInvoiceNumber: row.supplier_invoice_number,
    supplierId: row.supplier_id,
    supplierCode: row.supplier_code,
    supplierName: row.supplier_name,
    invoiceDate: parseDate(row.invoice_date, 'Supplier invoice settlement date'),
    dueDate: parseNullableDate(row.due_date, 'Supplier invoice settlement due date'),
    totalAmount: parseNumber(row.total_amount, 'Supplier invoice total'),
    paidAmount: parseNumber(row.paid_amount, 'Supplier invoice paid amount'),
    remainingAmount: parseNumber(row.remaining_amount, 'Supplier invoice remaining amount'),
    settlementStatus: row.settlement_status
  };
}

export function parseNumber(value: string | number, label: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} received from API is not a valid number.`);
  }

  return parsed;
}

function parseNullableDate(value: string | null, label: string): Date | null {
  return value ? parseDate(value, label) : null;
}

function parseDate(value: string, label: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} received from API is not a valid date.`);
  }

  return date;
}
