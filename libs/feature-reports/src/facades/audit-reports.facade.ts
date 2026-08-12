import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage } from '@daqiq/core';
import { firstValueFrom } from 'rxjs';

import { ReportRepository } from '../data-access/report-repository.service';
import type { ReportQuery } from '../models/report-query.model';
import type { AuditActivitySummaryReport } from '../models/report-row.model';
import { toReportError } from './report-error.util';

interface AuditReportsState {
  readonly auditActivityPage: ApiPage<AuditActivitySummaryReport> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
}

const DEFAULT_QUERY: ReportQuery = { page: 0, pageSize: 50 };

@Injectable()
export class AuditReportsFacade {
  private readonly repository = inject(ReportRepository);
  private readonly stateSignal = signal<AuditReportsState>({
    auditActivityPage: null,
    loading: false,
    error: null
  });

  readonly state: Signal<AuditReportsState> = this.stateSignal.asReadonly();
  readonly auditActivityItems = computed(() => this.state().auditActivityPage?.items ?? []);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadDefault(): Promise<void> {
    this.stateSignal.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const auditActivityPage = await firstValueFrom(
        this.repository.listAuditActivity(DEFAULT_QUERY)
      );
      this.stateSignal.set({ auditActivityPage, loading: false, error: null });
    } catch (error: unknown) {
      this.stateSignal.update((state) => ({ ...state, loading: false, error: toReportError(error) }));
    }
  }

  async refresh(): Promise<void> {
    await this.loadDefault();
  }
}
