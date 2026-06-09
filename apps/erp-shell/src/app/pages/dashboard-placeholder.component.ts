import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { DASHBOARD_PLACEHOLDER_LABELS } from './dashboard-placeholder.labels';

interface DashboardFoundationMetric {
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'app-dashboard-placeholder',
  template: `
    <section class="erp-page-placeholder">
      <div class="erp-page-placeholder__panel">
        <p class="erp-page-placeholder__eyebrow">{{ labels.eyebrow }}</p>
        <h1 class="erp-page-placeholder__title">{{ labels.title }}</h1>
        <p class="erp-page-placeholder__text">{{ labels.description }}</p>
      </div>

      <div class="erp-page-placeholder__grid" [attr.aria-label]="labels.infrastructureStatus">
        @for (metric of visibleMetrics(); track metric.label) {
          <article class="erp-page-placeholder__metric">
            <p class="erp-page-placeholder__metric-label">{{ metric.label }}</p>
            <p class="erp-page-placeholder__metric-value">{{ metric.value }}</p>
          </article>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPlaceholderComponent {
  protected readonly labels = DASHBOARD_PLACEHOLDER_LABELS;

  private readonly metrics = signal<readonly DashboardFoundationMetric[]>(
    DASHBOARD_PLACEHOLDER_LABELS.metrics
  );

  protected readonly visibleMetrics = computed(() => this.metrics());
}
