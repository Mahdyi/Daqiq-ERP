import { Validators } from '@angular/forms';
import { FormFieldConfig } from '@daqiq/ui';

import { CustomerFormValue } from '../models/customer-form-value.model';

export const CUSTOMER_FORM_FIELDS = [
  {
    key: 'code',
    kind: 'text',
    label: 'کد مشتری',
    placeholder: 'مانند CUST-1001',
    required: true,
    validators: [Validators.minLength(2), Validators.maxLength(40)]
  },
  {
    key: 'name',
    kind: 'text',
    label: 'نام مشتری',
    placeholder: 'نام شخص یا شرکت',
    required: true,
    validators: [Validators.minLength(2), Validators.maxLength(160)],
    colSpan: 2
  },
  {
    key: 'email',
    kind: 'email',
    label: 'ایمیل',
    placeholder: 'example@company.com',
    validators: [Validators.email]
  },
  {
    key: 'phone',
    kind: 'text',
    label: 'شماره تماس',
    placeholder: 'شماره تماس مشتری',
    validators: [Validators.maxLength(40)]
  },
  {
    key: 'customerType',
    kind: 'select',
    label: 'نوع مشتری',
    placeholder: 'نوع مشتری را انتخاب کنید',
    required: true,
    initialValue: 'corporate',
    options: [
      {
        label: 'حقیقی',
        value: 'individual'
      },
      {
        label: 'حقوقی',
        value: 'corporate'
      }
    ]
  },
  {
    key: 'creditLimit',
    kind: 'number',
    label: 'سقف اعتبار',
    placeholder: 'مبلغ سقف اعتبار',
    validators: [Validators.min(0)],
    visible: (value) => value.customerType === 'corporate',
    disabled: (value) => value.customerType !== 'corporate'
  },
  {
    key: 'active',
    kind: 'switch',
    label: 'فعال',
    initialValue: true
  }
] as const satisfies readonly FormFieldConfig<CustomerFormValue>[];
