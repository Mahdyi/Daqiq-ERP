import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type UiBadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'daqiq-badge',
  template: `<span [class]="'ui-badge ui-badge--' + tone()">{{ value() }}</span>`,
  styles: `
    :host {
      display: inline-flex;
    }

    .ui-badge {
      display: inline-flex;
      min-width: 1.5rem;
      min-height: 1.5rem;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      padding: 0 0.45rem;
      font-size: var(--erp-font-size-xs, 0.75rem);
      font-weight: var(--erp-font-weight-semibold, 600);
    }

    .ui-badge--neutral {
      background: var(--erp-surface-hover, #f1f5f9);
      color: var(--erp-text-color, #172033);
    }

    .ui-badge--primary {
      background: var(--erp-primary-color, #2563eb);
      color: var(--erp-primary-contrast-color, #fff);
    }

    .ui-badge--success {
      background: #dcfce7;
      color: #166534;
    }

    .ui-badge--warning {
      background: #fef3c7;
      color: #92400e;
    }

    .ui-badge--danger {
      background: #fee2e2;
      color: #991b1b;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeComponent {
  readonly value = input.required<string | number>();
  readonly tone = input<UiBadgeTone>('neutral');
}
