import { AbstractControl } from '@angular/forms';

import {
  FormFieldConfig,
  FormValidationErrorKey
} from '../models/form-field-config.model';

const DEFAULT_VALIDATION_MESSAGES = {
  required: 'این فیلد الزامی است.',
  email: 'فرمت ایمیل معتبر نیست.',
  minlength: 'حداقل تعداد کاراکتر رعایت نشده است.',
  maxlength: 'حداکثر تعداد کاراکتر مجاز رعایت نشده است.',
  min: 'مقدار واردشده کمتر از حد مجاز است.',
  max: 'مقدار واردشده بیشتر از حد مجاز است.',
  pattern: 'فرمت مقدار واردشده معتبر نیست.'
} satisfies Record<FormValidationErrorKey, string>;

const VALIDATION_ERROR_PRIORITY: readonly FormValidationErrorKey[] = [
  'required',
  'email',
  'minlength',
  'maxlength',
  'min',
  'max',
  'pattern'
];

export function getValidationMessage<TFormValue extends object>(
  control: AbstractControl<unknown>,
  field?: FormFieldConfig<TFormValue>
): string | null {
  if (!control.invalid || (!control.touched && !control.dirty)) {
    return null;
  }

  const errors = control.errors;

  if (!errors) {
    return null;
  }

  for (const key of VALIDATION_ERROR_PRIORITY) {
    if (errors[key]) {
      return (
        field?.validationMessages?.[key] ??
        DEFAULT_VALIDATION_MESSAGES[key]
      );
    }
  }

  return null;
}
