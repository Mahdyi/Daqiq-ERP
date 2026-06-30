import type { ValidatorFn } from '@angular/forms';

import type { FormFieldKind } from './form-field-kind.model';
import type { FormFieldOption, FormScalarValue } from './form-field-option.model';

export type FormFieldKey<TFormValue extends object> = Extract<
  {
    [TKey in keyof TFormValue]: TFormValue[TKey] extends FormScalarValue ? TKey : never;
  }[keyof TFormValue],
  string
>;

export type FormValidationErrorKey =
  | 'required'
  | 'email'
  | 'minlength'
  | 'maxlength'
  | 'min'
  | 'max'
  | 'pattern';

export type FormValidationMessages = Partial<Record<FormValidationErrorKey, string>>;

export interface FormFieldConfig<
  TFormValue extends object,
  TKey extends FormFieldKey<TFormValue> = FormFieldKey<TFormValue>
> {
  readonly key: TKey;
  readonly kind: FormFieldKind;
  readonly label: string;
  readonly placeholder?: string;
  readonly hint?: string;
  readonly required?: boolean;
  readonly readonly?: boolean;
  readonly initialValue?: TFormValue[TKey] & FormScalarValue;
  readonly validators?: readonly ValidatorFn[];
  readonly validationMessages?: FormValidationMessages;
  readonly options?: readonly FormFieldOption[];
  readonly rows?: number;
  readonly colSpan?: 1 | 2 | 3 | 4;
  readonly visible?: (value: Readonly<TFormValue>) => boolean;
  readonly disabled?: (value: Readonly<TFormValue>) => boolean;
}
