import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage, AuthorizationService } from '@daqiq/core';
import { firstValueFrom } from 'rxjs';

import { CustomerReceiptRepository } from '../data-access/customer-receipt-repository.service';
import type { CustomerReceipt, CustomerReceiptAllocation } from '../models/customer-receipt.model';
import type { PaymentListQuery } from '../models/payment-query.model';
import { toApiError } from './payment-error.util';
import type { SimplePageState } from './simple-page-state.model';

const DEFAULT_QUERY: PaymentListQuery = {
  page: 0,
  pageSize: 20,
  sortField: 'receiptDate',
  sortDirection: 'desc'
};

@Injectable()
export class CustomerReceiptFacade {
  private readonly repository = inject(CustomerReceiptRepository);
  private readonly authorization = inject(AuthorizationService);
  private readonly stateSignal = signal<SimplePageState<CustomerReceipt>>({
    page: null,
    loading: false,
    error: null,
    requestVersion: 0
  });
  private readonly querySignal = signal<PaymentListQuery | null>(null);
  private readonly selectedSignal = signal<CustomerReceipt | null>(null);
  private readonly allocationsSignal = signal<readonly CustomerReceiptAllocation[]>([]);
  private readonly detailLoadingSignal = signal(false);
  private readonly detailErrorSignal = signal<ApiError | null>(null);

  readonly state: Signal<SimplePageState<CustomerReceipt>> = this.stateSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly page = computed(() => this.state().page);
  readonly items = computed(() => this.page()?.items ?? []);
  readonly totalItems = computed(() => this.page()?.totalItems ?? 0);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly selected = this.selectedSignal.asReadonly();
  readonly allocations = this.allocationsSignal.asReadonly();
  readonly detailLoading = this.detailLoadingSignal.asReadonly();
  readonly detailError = this.detailErrorSignal.asReadonly();
  readonly canCreate = computed(() => this.authorization.hasPermission('payments.create'));

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

  async loadDetail(id: string): Promise<void> {
    this.detailLoadingSignal.set(true);
    this.detailErrorSignal.set(null);

    try {
      const [receipt, allocations] = await Promise.all([
        firstValueFrom(this.repository.getById(id)),
        firstValueFrom(this.repository.listAllocations(id))
      ]);
      this.selectedSignal.set(receipt);
      this.allocationsSignal.set(allocations);
    } catch (error: unknown) {
      this.detailErrorSignal.set(toApiError(error));
      this.selectedSignal.set(null);
      this.allocationsSignal.set([]);
    } finally {
      this.detailLoadingSignal.set(false);
    }
  }
}
