import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'daqiq-empty-state',
  template: `
    <section class="ui-empty-state">
      <i [class]="icon()" aria-hidden="true"></i>
      <h3>{{ message() }}</h3>
      @if (description()) {
        <p>{{ description() }}</p>
      }
      <ng-content />
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .ui-empty-state {
      display: grid;
      min-height: 12rem;
      place-items: center;
      align-content: center;
      gap: 0.5rem;
      color: var(--erp-text-muted-color, #64748b);
      padding: 1.5rem;
      text-align: center;
    }

    i {
      color: var(--erp-primary-color, #2563eb);
      font-size: 2rem;
    }

    h3,
    p {
      margin: 0;
    }

    h3 {
      color: var(--erp-text-color, #172033);
      font-size: var(--erp-font-size-heading-sm, 1.0625rem);
    }

    p {
      max-width: 32rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  readonly icon = input('pi pi-inbox');
  readonly message = input('داده‌ای برای نمایش وجود ندارد.');
  readonly description = input<string | null>(null);
}
