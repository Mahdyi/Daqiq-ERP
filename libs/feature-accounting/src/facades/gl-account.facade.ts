import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage } from '@daqiq/core';
import { firstValueFrom } from 'rxjs';

import { GlAccountRepository } from '../data-access/gl-account-repository.service';
import type { GlAccountQuery } from '../models/accounting-query.model';
import type { GlAccount } from '../models/gl-account.model';
import { toApiError } from './accounting-error.util';

const DEFAULT_QUERY: GlAccountQuery = {
  page: 0,
  pageSize: 50,
  sortField: 'accountCode',
  sortDirection: 'asc'
};

interface GlAccountState {
  readonly page: ApiPage<GlAccount> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
  readonly requestVersion: number;
}

@Injectable()
export class GlAccountFacade {
  private readonly repository = inject(GlAccountRepository);
  private readonly stateSignal = signal<GlAccountState>({
    page: null,
    loading: false,
    error: null,
    requestVersion: 0
  });
  private readonly querySignal = signal<GlAccountQuery | null>(null);

  readonly state: Signal<GlAccountState> = this.stateSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly page = computed(() => this.state().page);
  readonly items = computed(() => this.page()?.items ?? []);
  readonly postableAccounts = computed(() =>
    this.items().filter((account) => account.active && account.isPostable)
  );
  readonly totalItems = computed(() => this.page()?.totalItems ?? 0);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadDefault(): Promise<void> {
    await this.load(DEFAULT_QUERY);
  }

  async load(query: GlAccountQuery): Promise<void> {
    const requestVersion = this.state().requestVersion + 1;
    this.querySignal.set(query);
    this.stateSignal.update((state) => ({ ...state, loading: true, error: null, requestVersion }));

    try {
      const page = await firstValueFrom(this.repository.list(query));

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
