import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage } from '@daqiq/core';
import { firstValueFrom } from 'rxjs';

import { ReportRepository } from '../data-access/report-repository.service';
import type { ReportQuery } from '../models/report-query.model';
import type {
  InventoryMovementSummaryReport,
  InventoryOnHandReport
} from '../models/report-row.model';
import { toReportError } from './report-error.util';

interface InventoryReportsState {
  readonly onHandPage: ApiPage<InventoryOnHandReport> | null;
  readonly movementSummaryPage: ApiPage<InventoryMovementSummaryReport> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
  readonly requestVersion: number;
}

const DEFAULT_QUERY: ReportQuery = {
  page: 0,
  pageSize: 20
};

@Injectable()
export class InventoryReportsFacade {
  private readonly repository = inject(ReportRepository);
  private readonly stateSignal = signal<InventoryReportsState>({
    onHandPage: null,
    movementSummaryPage: null,
    loading: false,
    error: null,
    requestVersion: 0
  });
  private readonly querySignal = signal<ReportQuery | null>(null);

  readonly state: Signal<InventoryReportsState> = this.stateSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly onHandItems = computed(() => this.state().onHandPage?.items ?? []);
  readonly movementSummaryItems = computed(() => this.state().movementSummaryPage?.items ?? []);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadDefault(): Promise<void> {
    await this.load(DEFAULT_QUERY);
  }

  async load(query: ReportQuery): Promise<void> {
    const requestVersion = this.state().requestVersion + 1;
    this.querySignal.set(query);
    this.stateSignal.update((state) => ({ ...state, loading: true, error: null, requestVersion }));

    try {
      const [onHandPage, movementSummaryPage] = await Promise.all([
        firstValueFrom(this.repository.listInventoryOnHand(query)),
        firstValueFrom(this.repository.listInventoryMovementSummary(query))
      ]);

      if (this.state().requestVersion !== requestVersion) {
        return;
      }

      this.stateSignal.update((state) => ({
        ...state,
        onHandPage,
        movementSummaryPage,
        loading: false
      }));
    } catch (error: unknown) {
      if (this.state().requestVersion !== requestVersion) {
        return;
      }

      this.stateSignal.update((state) => ({ ...state, loading: false, error: toReportError(error) }));
    }
  }

  async refresh(): Promise<void> {
    await this.load(this.query() ?? DEFAULT_QUERY);
  }
}
