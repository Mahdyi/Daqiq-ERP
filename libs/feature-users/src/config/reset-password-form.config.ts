import { Validators } from '@angular/forms';
import { FormFieldConfig } from '@daqiq/ui';

import { ResetPasswordFormValue } from '../models/reset-password-form-value.model';

export const RESET_PASSWORD_FORM_FIELDS: readonly FormFieldConfig<ResetPasswordFormValue>[] = [
  {
    key: 'newPassword',
    kind: 'password',
    label: 'رمز عبور جدید',
    required: true,
    validators: [Validators.minLength(8)],
    colSpan: 2
  },
  {
    key: 'confirmPassword',
    kind: 'password',
    label: 'تکرار رمز عبور جدید',
    required: true,
    validators: [Validators.minLength(8)],
    colSpan: 2
  }
];
