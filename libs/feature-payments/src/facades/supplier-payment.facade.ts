import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage, AuthorizationService } from '@daqiq/core';
import { firstValueFrom } from 'rxjs';

import { SupplierPaymentRepository } from '../data-access/supplier-payment-repository.service';
import type { PaymentListQuery } from '../models/payment-query.model';
import type { SupplierPayment, SupplierPaymentAllocation } from '../models/supplier-payment.model';
import { toApiError } from './payment-error.util';
import type { SimplePageState } from './simple-page-state.model';

const DEFAULT_QUERY: PaymentListQuery = {
  page: 0,
  pageSize: 20,
  sortField: 'paymentDate',
  sortDirection: 'desc'
};

@Injectable()
export class SupplierPaymentFacade {
  private readonly repository = inject(SupplierPaymentRepository);
  private readonly authorization = inject(AuthorizationService);
  private readonly stateSignal = signal<SimplePageState<SupplierPayment>>({
    page: null,
    loading: false,
    error: null,
    requestVersion: 0
  });
  private readonly querySignal = signal<PaymentListQuery | null>(null);
  private readonly selectedSignal = signal<SupplierPayment | null>(null);
  private readonly allocationsSignal = signal<readonly SupplierPaymentAllocation[]>([]);
  private readonly detailLoadingSignal = signal(false);
  private readonly detailErrorSignal = signal<ApiError | null>(null);

  readonly state: Signal<SimplePageState<SupplierPayment>> = this.stateSignal.asReadonly();
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
      const [payment, allocations] = await Promise.all([
        firstValueFrom(this.repository.getById(id)),
        firstValueFrom(this.repository.listAllocations(id))
      ]);
      this.selectedSignal.set(payment);
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
