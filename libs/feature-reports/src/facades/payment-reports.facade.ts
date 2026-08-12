import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage } from '@daqiq/core';
import { firstValueFrom } from 'rxjs';

import { ReportRepository } from '../data-access/report-repository.service';
import type { ReportQuery } from '../models/report-query.model';
import type { PaymentSummaryReport } from '../models/report-row.model';
import { toReportError } from './report-error.util';

interface PaymentReportsState {
  readonly paymentSummaryPage: ApiPage<PaymentSummaryReport> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
}

const DEFAULT_QUERY: ReportQuery = { page: 0, pageSize: 20 };

@Injectable()
export class PaymentReportsFacade {
  private readonly repository = inject(ReportRepository);
  private readonly stateSignal = signal<PaymentReportsState>({
    paymentSummaryPage: null,
    loading: false,
    error: null
  });

  readonly state: Signal<PaymentReportsState> = this.stateSignal.asReadonly();
  readonly paymentSummaryItems = computed(() => this.state().paymentSummaryPage?.items ?? []);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadDefault(): Promise<void> {
    this.stateSignal.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const paymentSummaryPage = await firstValueFrom(
        this.repository.listPaymentSummary(DEFAULT_QUERY)
      );
      this.stateSignal.set({ paymentSummaryPage, loading: false, error: null });
    } catch (error: unknown) {
      this.stateSignal.update((state) => ({ ...state, loading: false, error: toReportError(error) }));
    }
  }

  async refresh(): Promise<void> {
    await this.loadDefault();
  }
}
