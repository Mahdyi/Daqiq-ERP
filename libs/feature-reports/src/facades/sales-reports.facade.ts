import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage } from '@daqiq/core';
import { firstValueFrom } from 'rxjs';

import { ReportRepository } from '../data-access/report-repository.service';
import type { ReportQuery } from '../models/report-query.model';
import type {
  AmountStatusReport,
  QuantityStatusReport,
  SalesInvoiceSettlementReport
} from '../models/report-row.model';
import { toReportError } from './report-error.util';

interface SalesReportsState {
  readonly salesOrderStatusPage: ApiPage<AmountStatusReport> | null;
  readonly salesDeliveryStatusPage: ApiPage<QuantityStatusReport> | null;
  readonly salesSettlementPage: ApiPage<SalesInvoiceSettlementReport> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
}

const DEFAULT_QUERY: ReportQuery = { page: 0, pageSize: 20 };

@Injectable()
export class SalesReportsFacade {
  private readonly repository = inject(ReportRepository);
  private readonly stateSignal = signal<SalesReportsState>({
    salesOrderStatusPage: null,
    salesDeliveryStatusPage: null,
    salesSettlementPage: null,
    loading: false,
    error: null
  });

  readonly state: Signal<SalesReportsState> = this.stateSignal.asReadonly();
  readonly salesOrderStatusItems = computed(() => this.state().salesOrderStatusPage?.items ?? []);
  readonly salesDeliveryStatusItems = computed(() => this.state().salesDeliveryStatusPage?.items ?? []);
  readonly salesSettlementItems = computed(() => this.state().salesSettlementPage?.items ?? []);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadDefault(): Promise<void> {
    this.stateSignal.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const [salesOrderStatusPage, salesDeliveryStatusPage, salesSettlementPage] =
        await Promise.all([
          firstValueFrom(this.repository.listSalesOrderStatus(DEFAULT_QUERY)),
          firstValueFrom(this.repository.listSalesDeliveryStatus(DEFAULT_QUERY)),
          firstValueFrom(this.repository.listSalesInvoiceSettlement(DEFAULT_QUERY))
        ]);

      this.stateSignal.set({
        salesOrderStatusPage,
        salesDeliveryStatusPage,
        salesSettlementPage,
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
