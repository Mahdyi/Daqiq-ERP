import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { FormFieldConfig } from '../../models/form-field-config.model';
import { FormScalarValue } from '../../models/form-field-option.model';
import { getValidationMessage } from '../../utilities/form-validation.util';

@Component({
  selector: 'daqiq-dynamic-form-field',
  imports: [
    ReactiveFormsModule,
    InputText,
    InputNumber,
    Textarea,
    Select,
    DatePicker,
    ToggleSwitch,
    Password
  ],
  templateUrl: './dynamic-form-field.component.html',
  styleUrl: './dynamic-form-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicFormFieldComponent<TFormValue extends object> {
  readonly field = input.required<FormFieldConfig<TFormValue>>();
  readonly control = input.required<FormControl<FormScalarValue>>();
  readonly formValue = input.required<Readonly<TFormValue>>();

  protected readonly inputId = computed(() => `daqiq-field-${String(this.field().key)}`);
  protected readonly errorId = computed(() => `${this.inputId()}-error`);
  protected readonly hintId = computed(() => `${this.inputId()}-hint`);
  protected readonly selectOptions = computed(() => [...(this.field().options ?? [])]);
  protected readonly invalid = computed(() => this.control().invalid && (this.control().touched || this.control().dirty));
  protected readonly validationMessage = computed(() =>
    getValidationMessage(this.control(), this.field())
  );

  protected describedBy(): string | null {
    const ids = [
      this.field().hint ? this.hintId() : null,
      this.validationMessage() ? this.errorId() : null
    ].filter((id): id is string => id !== null);

    return ids.length > 0 ? ids.join(' ') : null;
  }
}
