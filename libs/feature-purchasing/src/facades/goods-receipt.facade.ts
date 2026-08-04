import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage, AuthorizationService } from '@daqiq/core';
import { ConfirmationService, NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { GoodsReceiptCommandService } from '../data-access/goods-receipt-command.service';
import { GoodsReceiptRepository } from '../data-access/goods-receipt-repository.service';
import type { GoodsReceiptLine } from '../models/goods-receipt-line.model';
import type { GoodsReceiptQuery } from '../models/goods-receipt-query.model';
import type { GoodsReceipt } from '../models/goods-receipt.model';
import { toApiError } from './purchase-order.facade';

const DEFAULT_QUERY: GoodsReceiptQuery = {
  page: 0,
  pageSize: 20,
  sortField: 'receiptDate',
  sortDirection: 'desc'
};

interface GoodsReceiptListState {
  readonly page: ApiPage<GoodsReceipt> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
  readonly requestVersion: number;
}

@Injectable()
export class GoodsReceiptFacade {
  private readonly repository = inject(GoodsReceiptRepository);
  private readonly commands = inject(GoodsReceiptCommandService);
  private readonly authorization = inject(AuthorizationService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmations = inject(ConfirmationService);
  private readonly stateSignal = signal<GoodsReceiptListState>({
    page: null,
    loading: false,
    error: null,
    requestVersion: 0
  });
  private readonly querySignal = signal<GoodsReceiptQuery | null>(null);
  private readonly selectedReceiptSignal = signal<GoodsReceipt | null>(null);
  private readonly selectedLinesSignal = signal<readonly GoodsReceiptLine[]>([]);
  private readonly detailLoadingSignal = signal(false);
  private readonly detailErrorSignal = signal<ApiError | null>(null);
  private activeOperationCount = 0;

  readonly state: Signal<GoodsReceiptListState> = this.stateSignal.asReadonly();
  readonly query: Signal<GoodsReceiptQuery | null> = this.querySignal.asReadonly();
  readonly page = computed(() => this.state().page);
  readonly items = computed(() => this.page()?.items ?? []);
  readonly totalItems = computed(() => this.page()?.totalItems ?? 0);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly selectedReceipt = this.selectedReceiptSignal.asReadonly();
  readonly selectedLines = this.selectedLinesSignal.asReadonly();
  readonly detailLoading = this.detailLoadingSignal.asReadonly();
  readonly detailError = this.detailErrorSignal.asReadonly();
  readonly canCreate = computed(() => this.authorization.hasPermission('receiving.create'));
  readonly canPost = computed(() => this.authorization.hasPermission('receiving.post'));
  readonly canCancel = computed(() => this.authorization.hasPermission('receiving.cancel'));

  async loadDefault(): Promise<void> {
    await this.load(DEFAULT_QUERY);
  }

  async load(query: GoodsReceiptQuery): Promise<void> {
    const requestVersion = this.state().requestVersion + 1;
    this.querySignal.set(query);
    this.stateSignal.update((state) => ({
      ...state,
      loading: true,
      error: null,
      requestVersion
    }));

    try {
      const page = await firstValueFrom(this.repository.list(query));

      if (this.state().requestVersion !== requestVersion) {
        return;
      }

      this.stateSignal.update((state) => ({
        ...state,
        page,
        loading: false,
        error: null
      }));
    } catch (error: unknown) {
      if (this.state().requestVersion !== requestVersion) {
        return;
      }

      this.stateSignal.update((state) => ({
        ...state,
        loading: false,
        error: toApiError(error)
      }));
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

  async paginate(page: number, pageSize: number): Promise<void> {
    await this.load({
      ...(this.query() ?? DEFAULT_QUERY),
      page,
      pageSize
    });
  }

  async sort(
    sortField: keyof GoodsReceipt | null,
    sortDirection: 'asc' | 'desc' | null
  ): Promise<void> {
    await this.load({
      ...(this.query() ?? DEFAULT_QUERY),
      page: 0,
      sortField: sortField ?? undefined,
      sortDirection: sortDirection ?? undefined
    });
  }

  async loadDetail(id: string): Promise<void> {
    this.detailLoadingSignal.set(true);
    this.detailErrorSignal.set(null);

    try {
      const [receipt, lines] = await Promise.all([
        firstValueFrom(this.repository.getById(id)),
        firstValueFrom(this.repository.listLines(id))
      ]);
      this.selectedReceiptSignal.set(receipt);
      this.selectedLinesSignal.set(lines);
    } catch (error: unknown) {
      this.detailErrorSignal.set(toApiError(error));
      this.selectedReceiptSignal.set(null);
      this.selectedLinesSignal.set([]);
    } finally {
      this.detailLoadingSignal.set(false);
    }
  }

  async cancel(receipt: GoodsReceipt): Promise<void> {
    const accepted = await this.confirmations.confirm({
      header: 'لغو رسید خرید',
      message: 'آیا از لغو این رسید خرید مطمئن هستید؟ اثر موجودی با سند برگشتی خنثی می‌شود.',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger'
    });

    if (!accepted) {
      return;
    }

    this.beginOperation();

    try {
      const updated = await firstValueFrom(this.commands.cancelReceipt(receipt.id));
      this.selectedReceiptSignal.set(updated);
      this.notifications.success('رسید خرید با موفقیت لغو شد.');
      await this.refresh();
    } catch (error: unknown) {
      const apiError = toApiError(error);
      this.detailErrorSignal.set(apiError);
      this.stateSignal.update((state) => ({ ...state, error: apiError }));
    } finally {
      this.endOperation();
    }
  }

  canCancelStatus(status: GoodsReceipt['statusCode']): boolean {
    return status === 'posted' && this.canCancel();
  }

  private beginOperation(): void {
    this.activeOperationCount += 1;
    this.updateLoadingState();
  }

  private endOperation(): void {
    this.activeOperationCount = Math.max(0, this.activeOperationCount - 1);
    this.updateLoadingState();
  }

  private updateLoadingState(): void {
    const loading = this.activeOperationCount > 0;
    this.stateSignal.update((state) => state.loading === loading ? state : { ...state, loading });
  }
}
