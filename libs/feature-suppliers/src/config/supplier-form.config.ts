import { Validators } from '@angular/forms';
import type { FormFieldConfig, FormFieldOption } from '@daqiq/ui';

import type { SupplierFormValue } from '../models/supplier-form-value.model';

export interface SupplierLookupOptions {
  readonly supplierGroupOptions: readonly FormFieldOption[];
  readonly currencyOptions: readonly FormFieldOption[];
}

export function createSupplierFormFields(
  options: SupplierLookupOptions
): readonly FormFieldConfig<SupplierFormValue>[] {
  return [
    {
      key: 'code',
      kind: 'text',
      label: 'کد تأمین‌کننده',
      placeholder: 'مانند SUP-1001',
      required: true,
      validators: [Validators.minLength(2), Validators.maxLength(64)]
    },
    {
      key: 'name',
      kind: 'text',
      label: 'نام تأمین‌کننده',
      placeholder: 'نام شرکت یا شخص تأمین‌کننده',
      required: true,
      validators: [Validators.minLength(2), Validators.maxLength(200)],
      colSpan: 2
    },
    {
      key: 'email',
      kind: 'email',
      label: 'ایمیل',
      validators: [Validators.email, Validators.maxLength(320)]
    },
    {
      key: 'phone',
      kind: 'text',
      label: 'شماره تماس',
      validators: [Validators.maxLength(80)]
    },
    {
      key: 'taxNumber',
      kind: 'text',
      label: 'شناسه مالیاتی',
      validators: [Validators.maxLength(80)]
    },
    {
      key: 'contactPerson',
      kind: 'text',
      label: 'شخص تماس',
      validators: [Validators.maxLength(160)]
    },
    {
      key: 'website',
      kind: 'text',
      label: 'وب‌سایت',
      validators: [Validators.maxLength(320)]
    },
    {
      key: 'address',
      kind: 'textarea',
      label: 'آدرس',
      rows: 3,
      validators: [Validators.maxLength(1000)],
      colSpan: 2
    },
    {
      key: 'supplierGroupLookupValueId',
      kind: 'select',
      label: 'گروه تأمین‌کننده',
      options: options.supplierGroupOptions
    },
    {
      key: 'currencyLookupValueId',
      kind: 'select',
      label: 'ارز پیش‌فرض',
      options: options.currencyOptions
    },
    {
      key: 'paymentTermsDays',
      kind: 'number',
      label: 'مهلت پرداخت، روز',
      validators: [Validators.min(0)]
    },
    {
      key: 'active',
      kind: 'switch',
      label: 'فعال',
      initialValue: true
    }
  ];
}
