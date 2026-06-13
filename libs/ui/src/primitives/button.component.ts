import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type UiButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';
export type UiButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'daqiq-button',
  template: `
    <button
      [class]="'ui-button ui-button--' + variant()"
      [type]="type()"
      [disabled]="disabled() || loading()"
      (click)="handleClick($event)"
    >
      @if (loading()) {
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      } @else if (icon()) {
        <i [class]="icon()" aria-hidden="true"></i>
      }
      <span>{{ label() }}</span>
    </button>
  `,
  styles: `
    :host {
      display: inline-block;
    }

    .ui-button {
      display: inline-flex;
      min-height: 2.5rem;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border: 1px solid transparent;
      border-radius: var(--erp-layout-radius-md, 0.5rem);
      padding: 0 0.875rem;
      cursor: pointer;
      font-weight: var(--erp-font-weight-medium, 500);
    }

    .ui-button--primary {
      background: var(--erp-primary-color, #2563eb);
      color: var(--erp-primary-contrast-color, #fff);
    }

    .ui-button--secondary {
      border-color: var(--erp-border-color, #e2e8f0);
      background: var(--erp-surface-ground, #fff);
      color: var(--erp-text-color, #172033);
    }

    .ui-button--text {
      background: transparent;
      color: var(--erp-primary-color, #2563eb);
    }

    .ui-button--danger {
      background: #dc2626;
      color: #fff;
    }

    .ui-button:focus-visible {
      outline: none;
      box-shadow: var(--erp-focus-ring, 0 0 0 0.2rem rgb(37 99 235 / 22%));
    }

    .ui-button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  readonly label = input.required<string>();
  readonly icon = input<string | null>(null);
  readonly type = input<UiButtonType>('button');
  readonly variant = input<UiButtonVariant>('primary');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly pressed = output<MouseEvent>();

  protected handleClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.pressed.emit(event);
    }
  }
}
