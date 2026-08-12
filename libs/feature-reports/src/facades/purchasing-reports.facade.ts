import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage } from '@daqiq/core';
import { firstValueFrom } from 'rxjs';

import { ReportRepository } from '../data-access/report-repository.service';
import type { ReportQuery } from '../models/report-query.model';
import type {
  AmountStatusReport,
  QuantityStatusReport,
  SupplierInvoiceSettlementReport
} from '../models/report-row.model';
import { toReportError } from './report-error.util';

interface PurchasingReportsState {
  readonly purchaseOrderStatusPage: ApiPage<AmountStatusReport> | null;
  readonly goodsReceiptStatusPage: ApiPage<QuantityStatusReport> | null;
  readonly supplierSettlementPage: ApiPage<SupplierInvoiceSettlementReport> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
}

const DEFAULT_QUERY: ReportQuery = { page: 0, pageSize: 20 };

@Injectable()
export class PurchasingReportsFacade {
  private readonly repository = inject(ReportRepository);
  private readonly stateSignal = signal<PurchasingReportsState>({
    purchaseOrderStatusPage: null,
    goodsReceiptStatusPage: null,
    supplierSettlementPage: null,
    loading: false,
    error: null
  });

  readonly state: Signal<PurchasingReportsState> = this.stateSignal.asReadonly();
  readonly purchaseOrderStatusItems = computed(() => this.state().purchaseOrderStatusPage?.items ?? []);
  readonly goodsReceiptStatusItems = computed(() => this.state().goodsReceiptStatusPage?.items ?? []);
  readonly supplierSettlementItems = computed(() => this.state().supplierSettlementPage?.items ?? []);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadDefault(): Promise<void> {
    this.stateSignal.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const [purchaseOrderStatusPage, goodsReceiptStatusPage, supplierSettlementPage] =
        await Promise.all([
          firstValueFrom(this.repository.listPurchaseOrderStatus(DEFAULT_QUERY)),
          firstValueFrom(this.repository.listGoodsReceiptStatus(DEFAULT_QUERY)),
          firstValueFrom(this.repository.listSupplierInvoiceSettlement(DEFAULT_QUERY))
        ]);

      this.stateSignal.set({
        purchaseOrderStatusPage,
        goodsReceiptStatusPage,
        supplierSettlementPage,
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
