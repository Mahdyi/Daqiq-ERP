import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage, AuthorizationService } from '@daqiq/core';
import { firstValueFrom } from 'rxjs';

import { CashBankAccountRepository } from '../data-access/cash-bank-account-repository.service';
import type { CashBankAccount } from '../models/cash-bank-account.model';
import type { PaymentListQuery } from '../models/payment-query.model';
import { toApiError } from './payment-error.util';
import type { SimplePageState } from './simple-page-state.model';

const DEFAULT_QUERY: PaymentListQuery = {
  page: 0,
  pageSize: 20,
  sortField: 'accountCode',
  sortDirection: 'asc'
};

@Injectable()
export class CashBankAccountFacade {
  private readonly repository = inject(CashBankAccountRepository);
  private readonly authorization = inject(AuthorizationService);
  private readonly stateSignal = signal<SimplePageState<CashBankAccount>>({
    page: null,
    loading: false,
    error: null,
    requestVersion: 0
  });
  private readonly querySignal = signal<PaymentListQuery | null>(null);

  readonly state: Signal<SimplePageState<CashBankAccount>> = this.stateSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly page = computed(() => this.state().page);
  readonly items = computed(() => this.page()?.items ?? []);
  readonly totalItems = computed(() => this.page()?.totalItems ?? 0);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly canCreate = computed(() => this.authorization.hasPermission('cashBankAccounts.create'));
  readonly canUpdate = computed(() => this.authorization.hasPermission('cashBankAccounts.update'));

  async loadDefault(): Promise<void> {
    await this.load(DEFAULT_QUERY);
  }

  async load(query: PaymentListQuery): Promise<void> {
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
    await this.load({ ...(this.query() ?? DEFAULT_QUERY), page: 0, search: search.trim() || undefined });
  }
}
