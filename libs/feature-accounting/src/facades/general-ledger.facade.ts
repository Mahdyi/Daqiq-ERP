import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage } from '@daqiq/core';
import { firstValueFrom } from 'rxjs';

import { JournalEntryRepository } from '../data-access/journal-entry-repository.service';
import type { GeneralLedgerQuery } from '../models/accounting-query.model';
import type { GeneralLedgerLine } from '../models/general-ledger-line.model';
import { toApiError } from './accounting-error.util';

const DEFAULT_QUERY: GeneralLedgerQuery = {
  page: 0,
  pageSize: 50,
  sortDirection: 'desc'
};

interface GeneralLedgerState {
  readonly page: ApiPage<GeneralLedgerLine> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
  readonly requestVersion: number;
}

@Injectable()
export class GeneralLedgerFacade {
  private readonly repository = inject(JournalEntryRepository);
  private readonly stateSignal = signal<GeneralLedgerState>({
    page: null,
    loading: false,
    error: null,
    requestVersion: 0
  });
  private readonly querySignal = signal<GeneralLedgerQuery | null>(null);

  readonly state: Signal<GeneralLedgerState> = this.stateSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly page = computed(() => this.state().page);
  readonly items = computed(() => this.page()?.items ?? []);
  readonly totalItems = computed(() => this.page()?.totalItems ?? 0);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadDefault(): Promise<void> {
    await this.load(DEFAULT_QUERY);
  }

  async load(query: GeneralLedgerQuery): Promise<void> {
    const requestVersion = this.state().requestVersion + 1;
    this.querySignal.set(query);
    this.stateSignal.update((state) => ({ ...state, loading: true, error: null, requestVersion }));

    try {
      const page = await firstValueFrom(this.repository.listGeneralLedger(query));

      if (this.state().requestVersion !== requestVersion) {
        return;
      }

      this.stateSignal.update((state) => ({ ...state, page, loading: false }));
    } catch (error: unknown) {
      if (this.state().requestVersion !== requestVersion) {
        return;
      }

      this.stateSignal.update((state) => ({ ...state, loading: false, error: toApiError(error) }));
    }
  }

  async refresh(): Promise<void> {
    await this.load(this.query() ?? DEFAULT_QUERY);
  }

  async search(search: string): Promise<void> {
    await this.load({
      ...(this.query() ?? DEFAULT_QUERY),
      page: 0,
      search: search.trim() || undefined
    });
  }
}
