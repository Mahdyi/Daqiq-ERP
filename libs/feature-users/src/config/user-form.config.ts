import { Validators } from '@angular/forms';
import { FormFieldConfig } from '@daqiq/ui';

import { UserFormValue } from '../models/user-form-value.model';

const BASE_USER_FORM_FIELDS: readonly FormFieldConfig<UserFormValue>[] = [
  {
    key: 'email',
    kind: 'email',
    label: 'ایمیل',
    placeholder: 'user@example.com',
    required: true,
    validators: [Validators.email],
    colSpan: 2
  },
  {
    key: 'displayName',
    kind: 'text',
    label: 'نام نمایشی',
    required: true,
    colSpan: 2
  },
  {
    key: 'active',
    kind: 'switch',
    label: 'فعال',
    colSpan: 1
  }
];

export const CREATE_USER_FORM_FIELDS: readonly FormFieldConfig<UserFormValue>[] = [
  ...BASE_USER_FORM_FIELDS,
  {
    key: 'password',
    kind: 'password',
    label: 'رمز عبور اولیه',
    required: true,
    validators: [Validators.minLength(8)],
    colSpan: 2
  }
];

export const UPDATE_USER_FORM_FIELDS = BASE_USER_FORM_FIELDS;
