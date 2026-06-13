import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import {
  FilterChange,
  FilterDefinition,
  FilterOption,
  FilterValue
} from './filter.model';

@Component({
  selector: 'daqiq-filter',
  template: `
    <label class="ui-filter">
      <span>{{ definition().label }}</span>

      @if (definition().type === 'select') {
        <select
          [disabled]="definition().disabled === true"
          [value]="value() ?? ''"
          (change)="handleSelect($event)"
        >
          <option value="">{{ definition().placeholder ?? 'همه' }}</option>
          @for (option of definition().options ?? []; track option.value) {
            <option [value]="option.value ?? ''" [disabled]="option.disabled === true">
              {{ option.label }}
            </option>
          }
        </select>
      } @else {
        <input
          [type]="definition().type === 'number' ? 'number' : 'text'"
          [disabled]="definition().disabled === true"
          [placeholder]="definition().placeholder ?? ''"
          [value]="value() ?? ''"
          (input)="handleInput($event)"
        />
      }

      @if (value() !== null && value() !== '') {
        <button type="button" aria-label="پاک کردن فیلتر" (click)="reset.emit()">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      }
    </label>
  `,
  styles: `
    :host {
      display: block;
    }

    .ui-filter {
      position: relative;
      display: grid;
      gap: 0.375rem;
    }

    .ui-filter > span {
      color: var(--erp-text-muted-color, #64748b);
      font-size: var(--erp-font-size-sm, 0.8125rem);
      font-weight: var(--erp-font-weight-medium, 500);
    }

    input,
    select {
      width: 100%;
      min-height: 2.5rem;
      border: 1px solid var(--erp-border-color, #e2e8f0);
      border-radius: var(--erp-layout-radius-md, 0.5rem);
      background: var(--erp-surface-ground, #fff);
      color: var(--erp-text-color, #172033);
      padding-inline: 0.75rem 2.5rem;
    }

    button {
      position: absolute;
      inset-inline-end: 0.375rem;
      inset-block-end: 0.3125rem;
      display: inline-grid;
      width: 1.875rem;
      height: 1.875rem;
      place-items: center;
      border: 0;
      background: transparent;
      color: var(--erp-text-muted-color, #64748b);
      cursor: pointer;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterComponent<TKey extends string = string> {
  readonly definition = input.required<FilterDefinition<TKey>>();
  readonly value = input<FilterValue>(null);
  readonly filterChange = output<FilterChange<TKey>>();
  readonly reset = output<void>();

  protected handleInput(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const value: FilterValue =
      this.definition().type === 'number'
        ? target.value.trim() === ''
          ? null
          : target.valueAsNumber
        : target.value;

    this.emitValue(value);
  }

  protected handleSelect(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    this.emitValue(this.resolveOptionValue(target.value, this.definition().options ?? []));
  }

  private resolveOptionValue(rawValue: string, options: readonly FilterOption[]): FilterValue {
    if (rawValue === '') {
      return null;
    }

    return options.find((option) => String(option.value) === rawValue)?.value ?? rawValue;
  }

  private emitValue(value: FilterValue): void {
    this.filterChange.emit({
      key: this.definition().key,
      value
    });
  }
}
