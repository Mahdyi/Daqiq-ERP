import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'daqiq-card',
  template: `
    <section class="ui-card">
      @if (title() || subtitle()) {
        <header class="ui-card__header">
          <div>
            @if (title()) {
              <h2>{{ title() }}</h2>
            }
            @if (subtitle()) {
              <p>{{ subtitle() }}</p>
            }
          </div>
          <ng-content select="[cardActions]" />
        </header>
      }

      <div class="ui-card__content">
        <ng-content />
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .ui-card {
      border: 1px solid var(--erp-card-border-color, #e2e8f0);
      border-radius: var(--erp-layout-radius-md, 0.5rem);
      background: var(--erp-card-bg, #fff);
      box-shadow: var(--erp-shadow-sm, 0 1px 2px rgb(15 23 42 / 6%));
    }

    .ui-card__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      border-block-end: 1px solid var(--erp-card-border-color, #e2e8f0);
      padding: 1rem;
    }

    h2,
    p {
      margin: 0;
    }

    h2 {
      font-size: var(--erp-font-size-heading-sm, 1.0625rem);
    }

    p {
      margin-block-start: 0.25rem;
      color: var(--erp-text-muted-color, #64748b);
      font-size: var(--erp-font-size-sm, 0.8125rem);
    }

    .ui-card__content {
      padding: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  readonly title = input<string | null>(null);
  readonly subtitle = input<string | null>(null);
}
