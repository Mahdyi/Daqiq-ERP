import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage } from '@daqiq/core';
import { firstValueFrom } from 'rxjs';

import { SettlementRepository } from '../data-access/settlement-repository.service';
import type { SettlementQuery } from '../models/payment-query.model';
import type { SalesInvoiceSettlement, SupplierInvoiceSettlement } from '../models/settlement.model';
import { toApiError } from './payment-error.util';

interface SettlementState {
  readonly salesPage: ApiPage<SalesInvoiceSettlement> | null;
  readonly supplierPage: ApiPage<SupplierInvoiceSettlement> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
}

const DEFAULT_QUERY: SettlementQuery = {
  page: 0,
  pageSize: 20,
  sortField: 'invoiceDate',
  sortDirection: 'desc'
};

@Injectable()
export class SettlementFacade {
  private readonly repository = inject(SettlementRepository);
  private readonly stateSignal = signal<SettlementState>({
    salesPage: null,
    supplierPage: null,
    loading: false,
    error: null
  });
  private readonly querySignal = signal<SettlementQuery | null>(null);

  readonly state: Signal<SettlementState> = this.stateSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly salesItems = computed(() => this.state().salesPage?.items ?? []);
  readonly supplierItems = computed(() => this.state().supplierPage?.items ?? []);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadDefault(): Promise<void> {
    await this.load(DEFAULT_QUERY);
  }

  async load(query: SettlementQuery): Promise<void> {
    this.querySignal.set(query);
    this.stateSignal.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const [salesPage, supplierPage] = await Promise.all([
        firstValueFrom(this.repository.listSales(query)),
        firstValueFrom(this.repository.listSuppliers(query))
      ]);
      this.stateSignal.set({ salesPage, supplierPage, loading: false, error: null });
    } catch (error: unknown) {
      this.stateSignal.update((state) => ({ ...state, loading: false, error: toApiError(error) }));
    }
  }

  async refresh(): Promise<void> {
    await this.load(this.query() ?? DEFAULT_QUERY);
  }
}
