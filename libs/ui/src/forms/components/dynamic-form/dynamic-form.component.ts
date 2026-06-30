import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Subscription } from 'rxjs';

import { DynamicFormFieldComponent } from '../dynamic-form-field/dynamic-form-field.component';
import { FormFieldConfig } from '../../models/form-field-config.model';
import {
  DEFAULT_FORM_LAYOUT,
  FormLayoutConfig
} from '../../models/form-layout.model';
import { FormSubmitEvent } from '../../models/form-submit-event.model';
import {
  createDynamicFormGroup,
  DynamicFormGroup,
  getDynamicFormControl,
  getDynamicFormRawValue,
  patchDynamicFormValue
} from '../../utilities/form-control.util';

@Component({
  selector: 'daqiq-dynamic-form',
  imports: [
    ReactiveFormsModule,
    Button,
    DynamicFormFieldComponent
  ],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicFormComponent<TFormValue extends object> {
  readonly fields = input.required<readonly FormFieldConfig<TFormValue>[]>();
  readonly initialValue = input<Partial<TFormValue> | null>(null);
  readonly layout = input<FormLayoutConfig>({});
  readonly submitting = input(false);

  readonly submitted = output<FormSubmitEvent<TFormValue>>();
  readonly cancelled = output<void>();

  protected readonly form = signal<DynamicFormGroup<TFormValue> | null>(null);
  protected readonly formValue = signal<Readonly<TFormValue>>({} as Readonly<TFormValue>);
  protected readonly resolvedLayout = computed(() => ({
    ...DEFAULT_FORM_LAYOUT,
    ...this.layout()
  }));
  protected readonly visibleFields = computed(() =>
    this.fields().filter((field) => field.visible?.(this.formValue()) ?? true)
  );

  constructor() {
    effect((onCleanup) => {
      const fields = this.fields();
      const form = createDynamicFormGroup(fields);
      patchDynamicFormValue(form, this.initialValue());

      this.form.set(form);
      this.updateFormValue(form);
      this.applyDisabledState(form, fields);

      const subscription: Subscription = form.valueChanges.subscribe(() => {
        this.updateFormValue(form);
        this.applyDisabledState(form, fields);
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected controlFor(
    form: DynamicFormGroup<TFormValue>,
    field: FormFieldConfig<TFormValue>
  ) {
    return getDynamicFormControl(form, field.key);
  }

  protected fieldColSpan(field: FormFieldConfig<TFormValue>): string {
    return `span ${field.colSpan ?? 1}`;
  }

  protected handleSubmit(): void {
    const form = this.form();

    if (!form) {
      return;
    }

    if (form.invalid) {
      form.markAllAsTouched();
      form.updateValueAndValidity();
      this.updateFormValue(form);
      return;
    }

    this.submitted.emit({
      value: getDynamicFormRawValue(form),
      valid: true
    });
  }

  protected handleCancel(): void {
    this.cancelled.emit();
  }

  private updateFormValue(form: DynamicFormGroup<TFormValue>): void {
    this.formValue.set(getDynamicFormRawValue(form));
  }

  private applyDisabledState(
    form: DynamicFormGroup<TFormValue>,
    fields: readonly FormFieldConfig<TFormValue>[]
  ): void {
    const value = getDynamicFormRawValue(form);

    for (const field of fields) {
      const control = getDynamicFormControl(form, field.key);
      const shouldDisable = field.disabled?.(value) ?? false;

      if (shouldDisable && control.enabled) {
        control.disable({ emitEvent: false });
      } else if (!shouldDisable && control.disabled) {
        control.enable({ emitEvent: false });
      }
    }
  }
}
