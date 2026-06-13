import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'daqiq-loading',
  template: `
    <div class="ui-loading" role="status" [attr.aria-label]="message()">
      <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      @if (showMessage()) {
        <span>{{ message() }}</span>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .ui-loading {
      display: flex;
      min-height: 6rem;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      color: var(--erp-text-muted-color, #64748b);
    }

    i {
      color: var(--erp-primary-color, #2563eb);
      font-size: 1.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingComponent {
  readonly message = input('در حال بارگذاری');
  readonly showMessage = input(true);
}
