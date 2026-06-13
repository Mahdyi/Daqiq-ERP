import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormEngineConfig, FormFieldConfig, FormFieldOption } from './form-field.model';
import {
  FormFieldInputValue,
  FormFieldType,
  FormFieldValueChange
} from './form-engine.types';

@Component({
  selector: 'daqiq-form-engine',
  template: `
    <div
      class="ui-form-engine"
      [class.ui-form-engine--two-columns]="(config().columns ?? 1) === 2"
    >
      @for (field of config().fields; track field.key) {
        <label
          class="ui-form-engine__field"
          [class.ui-form-engine__field--wide]="field.columnSpan === 2"
        >
          <span class="ui-form-engine__label">
            {{ field.label }}
            @if (field.required) {
              <span aria-hidden="true">*</span>
            }
          </span>

          @if (field.type === 'select') {
            <select
              [disabled]="field.disabled === true"
              [value]="displayValue(field)"
              (change)="handleSelectChange($event, field)"
            >
              <option value="">{{ field.placeholder ?? 'انتخاب کنید' }}</option>
              @for (option of field.options ?? []; track option.value) {
                <option [value]="option.value ?? ''" [disabled]="option.disabled === true">
                  {{ option.label }}
                </option>
              }
            </select>
          } @else {
            <input
              [type]="inputType(field.type)"
              [value]="displayValue(field)"
              [placeholder]="field.placeholder ?? ''"
              [required]="field.required === true"
              [disabled]="field.disabled === true"
              [min]="field.min ?? null"
              [max]="field.max ?? null"
              [step]="field.step ?? null"
              (input)="handleInput($event, field)"
            />
          }

          @if (field.description) {
            <small>{{ field.description }}</small>
          }
        </label>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .ui-form-engine {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 1rem;
    }

    .ui-form-engine--two-columns {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .ui-form-engine__field {
      display: grid;
      gap: 0.375rem;
      min-width: 0;
    }

    .ui-form-engine__field--wide {
      grid-column: 1 / -1;
    }

    .ui-form-engine__label {
      font-size: var(--erp-font-size-sm, 0.8125rem);
      font-weight: var(--erp-font-weight-medium, 500);
    }

    .ui-form-engine__label span {
      color: #dc2626;
    }

    input,
    select {
      width: 100%;
      min-height: 2.75rem;
      border: 1px solid var(--erp-border-color, #e2e8f0);
      border-radius: var(--erp-layout-radius-md, 0.5rem);
      background: var(--erp-surface-ground, #fff);
      color: var(--erp-text-color, #172033);
      padding: 0 0.75rem;
    }

    input:focus,
    select:focus {
      border-color: var(--erp-primary-color, #2563eb);
      outline: none;
      box-shadow: var(--erp-focus-ring, 0 0 0 0.2rem rgb(37 99 235 / 22%));
    }

    input:disabled,
    select:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    small {
      color: var(--erp-text-muted-color, #64748b);
    }

    @media (max-width: 720px) {
      .ui-form-engine--two-columns {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormEngineComponent<TModel extends object> {
  readonly config = input.required<FormEngineConfig<TModel>>();
  readonly value = input<Partial<TModel>>({});
  readonly fieldValueChange = output<FormFieldValueChange<TModel>>();

  protected displayValue(field: FormFieldConfig<TModel>): string | number {
    const value = this.value()[field.key];

    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    return typeof value === 'string' || typeof value === 'number' ? value : '';
  }

  protected inputType(type: FormFieldType): 'text' | 'number' | 'date' {
    return type === 'number' || type === 'date' ? type : 'text';
  }

  protected handleInput(event: Event, field: FormFieldConfig<TModel>): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const value: FormFieldInputValue =
      field.type === 'number'
        ? target.value.trim() === ''
          ? null
          : target.valueAsNumber
        : target.value;

    this.emitValue(field, value);
  }

  protected handleSelectChange(event: Event, field: FormFieldConfig<TModel>): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    const value = this.resolveOptionValue(target.value, field.options ?? []);
    this.emitValue(field, value);
  }

  private resolveOptionValue(
    rawValue: string,
    options: readonly FormFieldOption[]
  ): FormFieldInputValue {
    if (rawValue === '') {
      return null;
    }

    return options.find((option) => String(option.value) === rawValue)?.value ?? rawValue;
  }

  private emitValue(field: FormFieldConfig<TModel>, value: FormFieldInputValue): void {
    this.fieldValueChange.emit({
      field: field.key,
      value
    });
  }
}
