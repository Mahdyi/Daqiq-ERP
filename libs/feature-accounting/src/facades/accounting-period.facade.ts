import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage } from '@daqiq/core';
import { firstValueFrom } from 'rxjs';

import { AccountingPeriodRepository } from '../data-access/accounting-period-repository.service';
import type { AccountingPeriod } from '../models/accounting-period.model';
import { toApiError } from './accounting-error.util';

interface AccountingPeriodState {
  readonly page: ApiPage<AccountingPeriod> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
}

@Injectable()
export class AccountingPeriodFacade {
  private readonly repository = inject(AccountingPeriodRepository);
  private readonly stateSignal = signal<AccountingPeriodState>({
    page: null,
    loading: false,
    error: null
  });

  readonly state: Signal<AccountingPeriodState> = this.stateSignal.asReadonly();
  readonly page = computed(() => this.state().page);
  readonly items = computed(() => this.page()?.items ?? []);
  readonly totalItems = computed(() => this.page()?.totalItems ?? 0);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async load(): Promise<void> {
    this.stateSignal.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const page = await firstValueFrom(this.repository.list());
      this.stateSignal.set({ page, loading: false, error: null });
    } catch (error: unknown) {
      this.stateSignal.update((state) => ({ ...state, loading: false, error: toApiError(error) }));
    }
  }
}
