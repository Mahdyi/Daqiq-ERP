import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';

import {
  FormFieldConfig,
  FormFieldKey
} from '../models/form-field-config.model';
import { FormScalarValue } from '../models/form-field-option.model';

export type DynamicFormControls<TFormValue extends object> = {
  [TKey in FormFieldKey<TFormValue>]: FormControl<Extract<TFormValue[TKey], FormScalarValue>>;
};

export type DynamicFormGroup<TFormValue extends object> = FormGroup<
  DynamicFormControls<TFormValue>
>;

export function createDynamicFormGroup<TFormValue extends object>(
  fields: readonly FormFieldConfig<TFormValue>[]
): DynamicFormGroup<TFormValue> {
  const controls: Partial<DynamicFormControls<TFormValue>> = {};

  for (const field of fields) {
    const key = field.key;
    const defaultValue = resolveDefaultValue(field);

    controls[key] = new FormControl(defaultValue, {
      validators: resolveValidators(field)
    }) as DynamicFormControls<TFormValue>[typeof key];
  }

  return new FormGroup(
    controls as DynamicFormControls<TFormValue>
  ) as DynamicFormGroup<TFormValue>;
}

export function patchDynamicFormValue<TFormValue extends object>(
  form: DynamicFormGroup<TFormValue>,
  value: Partial<TFormValue> | null | undefined
): void {
  if (!value) {
    return;
  }

  const controls = form.controls as unknown as Record<string, FormControl<FormScalarValue>>;

  for (const [key, fieldValue] of Object.entries(value)) {
    const control = controls[key];

    if (!control || !isFormScalarValue(fieldValue)) {
      continue;
    }

    control.setValue(fieldValue, {
      emitEvent: false
    });
  }

  form.updateValueAndValidity({
    emitEvent: false
  });
}

export function getDynamicFormRawValue<TFormValue extends object>(
  form: DynamicFormGroup<TFormValue>
): Readonly<TFormValue> {
  return form.getRawValue() as Readonly<TFormValue>;
}

export function getDynamicFormControl<TFormValue extends object>(
  form: DynamicFormGroup<TFormValue>,
  key: FormFieldKey<TFormValue>
): FormControl<FormScalarValue> {
  const controls = form.controls as unknown as Record<string, FormControl<FormScalarValue>>;
  const control = controls[key];

  if (!control) {
    throw new Error(`Dynamic form control "${key}" was not found.`);
  }

  return control;
}

function resolveDefaultValue<TFormValue extends object>(
  field: FormFieldConfig<TFormValue>
): Extract<TFormValue[typeof field.key], FormScalarValue> {
  if (field.initialValue !== undefined) {
    return field.initialValue as Extract<TFormValue[typeof field.key], FormScalarValue>;
  }

  const defaultValue: FormScalarValue = field.kind === 'switch' ? false : null;

  return defaultValue as Extract<TFormValue[typeof field.key], FormScalarValue>;
}

function resolveValidators<TFormValue extends object>(
  field: FormFieldConfig<TFormValue>
): ValidatorFn[] {
  const validators = [...(field.validators ?? [])];

  if (field.required) {
    validators.unshift(Validators.required);
  }

  return validators;
}

function isFormScalarValue(value: unknown): value is FormScalarValue {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date
  );
}
