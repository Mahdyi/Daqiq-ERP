import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type UiTagTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'daqiq-tag',
  template: `
    <span [class]="'ui-tag ui-tag--' + tone()">
      @if (icon()) {
        <i [class]="icon()" aria-hidden="true"></i>
      }
      <span>{{ label() }}</span>
      @if (removable()) {
        <button type="button" aria-label="حذف برچسب" (click)="removed.emit()">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .ui-tag {
      display: inline-flex;
      min-height: 1.75rem;
      align-items: center;
      gap: 0.375rem;
      border-radius: 999px;
      padding: 0 0.625rem;
      font-size: var(--erp-font-size-sm, 0.8125rem);
      font-weight: var(--erp-font-weight-medium, 500);
    }

    .ui-tag--neutral {
      background: var(--erp-surface-hover, #f1f5f9);
      color: var(--erp-text-color, #172033);
    }

    .ui-tag--primary {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .ui-tag--success {
      background: #dcfce7;
      color: #166534;
    }

    .ui-tag--warning {
      background: #fef3c7;
      color: #92400e;
    }

    .ui-tag--danger {
      background: #fee2e2;
      color: #991b1b;
    }

    button {
      display: inline-grid;
      width: 1.25rem;
      height: 1.25rem;
      place-items: center;
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      padding: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagComponent {
  readonly label = input.required<string>();
  readonly icon = input<string | null>(null);
  readonly tone = input<UiTagTone>('neutral');
  readonly removable = input(false);
  readonly removed = output<void>();
}
