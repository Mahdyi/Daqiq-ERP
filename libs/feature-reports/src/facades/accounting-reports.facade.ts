import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage } from '@daqiq/core';
import { firstValueFrom } from 'rxjs';

import { ReportRepository } from '../data-access/report-repository.service';
import type { ReportQuery } from '../models/report-query.model';
import type { GeneralLedgerSummaryReport, JournalActivityReport } from '../models/report-row.model';
import { toReportError } from './report-error.util';

interface AccountingReportsState {
  readonly generalLedgerSummaryPage: ApiPage<GeneralLedgerSummaryReport> | null;
  readonly journalActivityPage: ApiPage<JournalActivityReport> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
}

const DEFAULT_QUERY: ReportQuery = { page: 0, pageSize: 50 };

@Injectable()
export class AccountingReportsFacade {
  private readonly repository = inject(ReportRepository);
  private readonly stateSignal = signal<AccountingReportsState>({
    generalLedgerSummaryPage: null,
    journalActivityPage: null,
    loading: false,
    error: null
  });

  readonly state: Signal<AccountingReportsState> = this.stateSignal.asReadonly();
  readonly generalLedgerSummaryItems = computed(() => this.state().generalLedgerSummaryPage?.items ?? []);
  readonly journalActivityItems = computed(() => this.state().journalActivityPage?.items ?? []);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadDefault(): Promise<void> {
    this.stateSignal.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const [generalLedgerSummaryPage, journalActivityPage] = await Promise.all([
        firstValueFrom(this.repository.listGeneralLedgerSummary(DEFAULT_QUERY)),
        firstValueFrom(this.repository.listJournalActivity(DEFAULT_QUERY))
      ]);

      this.stateSignal.set({
        generalLedgerSummaryPage,
        journalActivityPage,
        loading: false,
        error: null
      });
    } catch (error: unknown) {
      this.stateSignal.update((state) => ({ ...state, loading: false, error: toReportError(error) }));
    }
  }

  async refresh(): Promise<void> {
    await this.loadDefault();
  }
}
