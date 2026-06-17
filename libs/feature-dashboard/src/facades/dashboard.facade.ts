import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { DashboardApiService } from '../data-access/dashboard-api.service';
import { mapDashboardSummaryResponse } from '../mappers/dashboard-summary.mapper';
import { DashboardSummary } from '../models/dashboard-summary.model';

const DASHBOARD_ERROR_MESSAGE = 'دریافت اطلاعات داشبورد با مشکل روبه‌رو شد.';

@Injectable()
export class DashboardFacade {
  private readonly api = inject(DashboardApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dateFormatter = new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  private readonly numberFormatter = new Intl.NumberFormat('fa-IR');

  private readonly summaryState = signal<DashboardSummary | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly summary = this.summaryState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly kpis = computed(() => this.summary()?.kpis ?? []);
  readonly lastUpdatedLabel = computed(() => {
    const summary = this.summary();
    return summary ? this.dateFormatter.format(summary.lastUpdatedAt) : '';
  });

  formatValue(value: number): string {
    return this.numberFormatter.format(value);
  }

  load(): void {
    if (this.loading()) {
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    this.api
      .getSummary()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingState.set(false))
      )
      .subscribe({
        next: (response) => {
          this.summaryState.set(mapDashboardSummaryResponse(response));
        },
        error: () => {
          this.errorState.set(DASHBOARD_ERROR_MESSAGE);
        }
      });
  }
}
