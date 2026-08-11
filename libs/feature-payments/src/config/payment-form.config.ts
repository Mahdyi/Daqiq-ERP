import { Validators } from '@angular/forms';
import type { FormFieldConfig, FormFieldOption } from '@daqiq/ui';

import type {
  CustomerReceiptFormValue,
  SupplierPaymentFormValue
} from '../models/payment-form-value.model';

export interface PaymentEditorOptions {
  readonly cashBankAccounts: readonly FormFieldOption[];
  readonly currencies: readonly FormFieldOption[];
  readonly paymentMethods: readonly FormFieldOption[];
  readonly salesInvoices: readonly FormFieldOption[];
  readonly supplierInvoices: readonly FormFieldOption[];
}

export function createCustomerReceiptFormFields(
  options: PaymentEditorOptions
): readonly FormFieldConfig<CustomerReceiptFormValue>[] {
  return [
    {
      key: 'customerId',
      kind: 'text',
      label: 'شناسه مشتری',
      required: true
    },
    {
      key: 'cashBankAccountId',
      kind: 'select',
      label: 'حساب نقد/بانک',
      required: true,
      options: options.cashBankAccounts
    },
    {
      key: 'salesInvoiceId',
      kind: 'select',
      label: 'فاکتور فروش',
      required: true,
      options: options.salesInvoices
    },
    {
      key: 'receiptDate',
      kind: 'date',
      label: 'تاریخ دریافت',
      required: true
    },
    {
      key: 'currencyLookupValueId',
      kind: 'select',
      label: 'ارز',
      options: options.currencies
    },
    {
      key: 'paymentMethodLookupValueId',
      kind: 'select',
      label: 'روش پرداخت',
      options: options.paymentMethods
    },
    {
      key: 'amount',
      kind: 'number',
      label: 'مبلغ',
      required: true,
      validators: [Validators.min(0.01)]
    },
    {
      key: 'allocatedAmount',
      kind: 'number',
      label: 'مبلغ تخصیص',
      required: true,
      validators: [Validators.min(0.01)]
    },
    {
      key: 'referenceNumber',
      kind: 'text',
      label: 'شماره پیگیری'
    },
    {
      key: 'notes',
      kind: 'textarea',
      label: 'یادداشت',
      rows: 3,
      colSpan: 2
    }
  ];
}

export function createSupplierPaymentFormFields(
  options: PaymentEditorOptions
): readonly FormFieldConfig<SupplierPaymentFormValue>[] {
  return [
    {
      key: 'supplierId',
      kind: 'text',
      label: 'شناسه تأمین‌کننده',
      required: true
    },
    {
      key: 'cashBankAccountId',
      kind: 'select',
      label: 'حساب نقد/بانک',
      required: true,
      options: options.cashBankAccounts
    },
    {
      key: 'supplierInvoiceId',
      kind: 'select',
      label: 'فاکتور تأمین‌کننده',
      required: true,
      options: options.supplierInvoices
    },
    {
      key: 'paymentDate',
      kind: 'date',
      label: 'تاریخ پرداخت',
      required: true
    },
    {
      key: 'currencyLookupValueId',
      kind: 'select',
      label: 'ارز',
      options: options.currencies
    },
    {
      key: 'paymentMethodLookupValueId',
      kind: 'select',
      label: 'روش پرداخت',
      options: options.paymentMethods
    },
    {
      key: 'amount',
      kind: 'number',
      label: 'مبلغ',
      required: true,
      validators: [Validators.min(0.01)]
    },
    {
      key: 'allocatedAmount',
      kind: 'number',
      label: 'مبلغ تخصیص',
      required: true,
      validators: [Validators.min(0.01)]
    },
    {
      key: 'referenceNumber',
      kind: 'text',
      label: 'شماره پیگیری'
    },
    {
      key: 'notes',
      kind: 'textarea',
      label: 'یادداشت',
      rows: 3,
      colSpan: 2
    }
  ];
}
