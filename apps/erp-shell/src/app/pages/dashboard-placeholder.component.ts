import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

interface DashboardFoundationMetric {
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'app-dashboard-placeholder',
  template: `
    <section class="erp-page-placeholder">
      <div class="erp-page-placeholder__panel">
        <p class="erp-page-placeholder__eyebrow">داشبورد</p>
        <h1 class="erp-page-placeholder__title">زیرساخت پوسته ERP آماده است</h1>
        <p class="erp-page-placeholder__text">
          این صفحه فقط جایگاه اولیه داشبورد است. در مراحل بعدی، ماژول‌های واقعی،
          داده‌ها، نقش‌ها و ابزارهای سازمانی به صورت lazy-loaded به این پوسته متصل می‌شوند.
        </p>
      </div>

      <div class="erp-page-placeholder__grid" aria-label="وضعیت زیرساخت">
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
  private readonly metrics = signal<readonly DashboardFoundationMetric[]>([
    {
      label: 'وضعیت PrimeNG',
      value: 'Aura فعال'
    },
    {
      label: 'ساختار مسیرها',
      value: 'آماده lazy-load'
    },
    {
      label: 'چیدمان',
      value: 'RTL shell'
    }
  ]);

  protected readonly visibleMetrics = computed(() => this.metrics());
}
