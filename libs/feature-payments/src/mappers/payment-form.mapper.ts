import type {
  PostCustomerReceiptRequestDto,
  PostSupplierPaymentRequestDto
} from '../dto/payment-command.dto';
import type {
  CustomerReceiptFormValue,
  SupplierPaymentFormValue
} from '../models/payment-form-value.model';

export function mapCustomerReceiptFormToRequest(
  value: CustomerReceiptFormValue
): PostCustomerReceiptRequestDto {
  const customerId = requireValue(value.customerId, 'Customer');
  const cashBankAccountId = requireValue(value.cashBankAccountId, 'Cash/bank account');
  const salesInvoiceId = requireValue(value.salesInvoiceId, 'Sales invoice');
  const amount = requirePositiveNumber(value.amount, 'Receipt amount');
  const allocatedAmount = requirePositiveNumber(value.allocatedAmount ?? value.amount, 'Allocated amount');

  return {
    customer_id: customerId,
    cash_bank_account_id: cashBankAccountId,
    receipt_date: toIsoDate(value.receiptDate),
    currency_lookup_value_id: normalizeOptional(value.currencyLookupValueId),
    payment_method_lookup_value_id: normalizeOptional(value.paymentMethodLookupValueId),
    amount,
    reference_number: normalizeOptional(value.referenceNumber),
    notes: normalizeOptional(value.notes),
    allocations: [{ salesInvoiceId, allocatedAmount }]
  };
}

export function mapSupplierPaymentFormToRequest(
  value: SupplierPaymentFormValue
): PostSupplierPaymentRequestDto {
  const supplierId = requireValue(value.supplierId, 'Supplier');
  const cashBankAccountId = requireValue(value.cashBankAccountId, 'Cash/bank account');
  const supplierInvoiceId = requireValue(value.supplierInvoiceId, 'Supplier invoice');
  const amount = requirePositiveNumber(value.amount, 'Payment amount');
  const allocatedAmount = requirePositiveNumber(value.allocatedAmount ?? value.amount, 'Allocated amount');

  return {
    supplier_id: supplierId,
    cash_bank_account_id: cashBankAccountId,
    payment_date: toIsoDate(value.paymentDate),
    currency_lookup_value_id: normalizeOptional(value.currencyLookupValueId),
    payment_method_lookup_value_id: normalizeOptional(value.paymentMethodLookupValueId),
    amount,
    reference_number: normalizeOptional(value.referenceNumber),
    notes: normalizeOptional(value.notes),
    allocations: [{ supplierInvoiceId, allocatedAmount }]
  };
}

function requireValue(value: string | null, label: string): string {
  const normalized = normalizeOptional(value);

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function requirePositiveNumber(value: number | null, label: string): number {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be greater than zero.`);
  }

  return value;
}

function normalizeOptional(value: string | null): string | null {
  const normalized = value?.trim() ?? '';
  return normalized ? normalized : null;
}

function toIsoDate(value: Date | null): string {
  return (value ?? new Date()).toISOString().slice(0, 10);
}
