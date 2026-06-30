import { Validators } from '@angular/forms';

import {
  createDynamicFormGroup,
  getDynamicFormControl,
  getDynamicFormRawValue,
  patchDynamicFormValue
} from './form-control.util';
import { FormFieldConfig } from '../models/form-field-config.model';

interface DemoFormValue {
  readonly name: string | null;
  readonly email: string | null;
  readonly creditLimit: number | null;
  readonly active: boolean;
}

const fields: readonly FormFieldConfig<DemoFormValue>[] = [
  {
    key: 'name',
    kind: 'text',
    label: 'نام',
    required: true
  },
  {
    key: 'email',
    kind: 'email',
    label: 'ایمیل',
    validators: [Validators.email]
  },
  {
    key: 'creditLimit',
    kind: 'number',
    label: 'سقف اعتبار',
    initialValue: 100
  },
  {
    key: 'active',
    kind: 'switch',
    label: 'فعال'
  }
];

describe('createDynamicFormGroup', () => {
  it('creates controls with required validators and default values', () => {
    const form = createDynamicFormGroup(fields);

    expect(getDynamicFormControl(form, 'name').hasValidator(Validators.required)).toBeTrue();
    expect(getDynamicFormControl(form, 'creditLimit').value).toBe(100);
    expect(getDynamicFormControl(form, 'active').value).toBeFalse();
  });

  it('patches typed initial values without emitting form events', () => {
    const form = createDynamicFormGroup(fields);
    let valueChangeCount = 0;

    form.valueChanges.subscribe(() => {
      valueChangeCount += 1;
    });

    patchDynamicFormValue(form, {
      name: 'شرکت دقیق',
      active: true
    });

    expect(getDynamicFormRawValue(form)).toEqual({
      name: 'شرکت دقیق',
      email: null,
      creditLimit: 100,
      active: true
    });
    expect(valueChangeCount).toBe(0);
  });
});
