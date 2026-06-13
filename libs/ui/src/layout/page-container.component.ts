import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'daqiq-page-container',
  template: `
    <section class="ui-page-container">
      @if (title() || subtitle()) {
        <header class="ui-page-container__header">
          <div>
            @if (title()) {
              <h1>{{ title() }}</h1>
            }
            @if (subtitle()) {
              <p>{{ subtitle() }}</p>
            }
          </div>
          <div class="ui-page-container__actions">
            <ng-content select="[pageActions]" />
          </div>
        </header>
      }

      <div class="ui-page-container__content">
        <ng-content />
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .ui-page-container {
      display: grid;
      gap: 1rem;
      width: min(100%, 100rem);
      margin-inline: auto;
    }

    .ui-page-container__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    h1,
    p {
      margin: 0;
    }

    h1 {
      font-size: var(--erp-font-size-heading-lg, 1.5rem);
    }

    p {
      margin-block-start: 0.25rem;
      color: var(--erp-text-muted-color, #64748b);
    }

    .ui-page-container__actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    @media (max-width: 640px) {
      .ui-page-container__header {
        flex-direction: column;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageContainerComponent {
  readonly title = input<string | null>(null);
  readonly subtitle = input<string | null>(null);
}
