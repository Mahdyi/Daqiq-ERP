import { FormControl, Validators } from '@angular/forms';

import { getValidationMessage } from './form-validation.util';

describe('getValidationMessage', () => {
  it('returns null before the control is touched or dirty', () => {
    const control = new FormControl<string | null>(null, {
      validators: [Validators.required]
    });

    expect(getValidationMessage(control)).toBeNull();
  });

  it('returns Persian required messages', () => {
    const control = new FormControl<string | null>(null, {
      validators: [Validators.required]
    });

    control.markAsTouched();

    expect(getValidationMessage(control)).toBe('این فیلد الزامی است.');
  });

  it('returns Persian email messages', () => {
    const control = new FormControl<string | null>('invalid', {
      validators: [Validators.email]
    });

    control.markAsDirty();

    expect(getValidationMessage(control)).toBe('فرمت ایمیل معتبر نیست.');
  });

  it('returns Persian min and max messages', () => {
    const minControl = new FormControl<number | null>(1, {
      validators: [Validators.min(2)]
    });
    const maxControl = new FormControl<number | null>(5, {
      validators: [Validators.max(4)]
    });

    minControl.markAsTouched();
    maxControl.markAsTouched();

    expect(getValidationMessage(minControl)).toBe('مقدار واردشده کمتر از حد مجاز است.');
    expect(getValidationMessage(maxControl)).toBe('مقدار واردشده بیشتر از حد مجاز است.');
  });
});
