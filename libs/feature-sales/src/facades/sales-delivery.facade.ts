import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage, AuthorizationService } from '@daqiq/core';
import { ConfirmationService, NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { SalesDeliveryCommandService } from '../data-access/sales-delivery-command.service';
import { SalesDeliveryRepository } from '../data-access/sales-delivery-repository.service';
import type { SalesDeliveryLine } from '../models/sales-delivery-line.model';
import type { SalesDeliveryQuery } from '../models/sales-delivery-query.model';
import type { SalesDelivery } from '../models/sales-delivery.model';
import { toApiError } from './sales-order.facade';

const DEFAULT_QUERY: SalesDeliveryQuery = {
  page: 0,
  pageSize: 20,
  sortField: 'deliveryDate',
  sortDirection: 'desc'
};

interface SalesDeliveryListState {
  readonly page: ApiPage<SalesDelivery> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
  readonly requestVersion: number;
}

@Injectable()
export class SalesDeliveryFacade {
  private readonly repository = inject(SalesDeliveryRepository);
  private readonly commands = inject(SalesDeliveryCommandService);
  private readonly authorization = inject(AuthorizationService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmations = inject(ConfirmationService);
  private readonly stateSignal = signal<SalesDeliveryListState>({
    page: null,
    loading: false,
    error: null,
    requestVersion: 0
  });
  private readonly querySignal = signal<SalesDeliveryQuery | null>(null);
  private readonly selectedDeliverySignal = signal<SalesDelivery | null>(null);
  private readonly selectedLinesSignal = signal<readonly SalesDeliveryLine[]>([]);
  private readonly detailLoadingSignal = signal(false);
  private readonly detailErrorSignal = signal<ApiError | null>(null);
  private activeOperationCount = 0;

  readonly state: Signal<SalesDeliveryListState> = this.stateSignal.asReadonly();
  readonly query: Signal<SalesDeliveryQuery | null> = this.querySignal.asReadonly();
  readonly page = computed(() => this.state().page);
  readonly items = computed(() => this.page()?.items ?? []);
  readonly totalItems = computed(() => this.page()?.totalItems ?? 0);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly selectedDelivery = this.selectedDeliverySignal.asReadonly();
  readonly selectedLines = this.selectedLinesSignal.asReadonly();
  readonly detailLoading = this.detailLoadingSignal.asReadonly();
  readonly detailError = this.detailErrorSignal.asReadonly();
  readonly canCancel = computed(() => this.authorization.hasPermission('salesDeliveries.cancel'));

  async loadDefault(): Promise<void> {
    await this.load(DEFAULT_QUERY);
  }

  async load(query: SalesDeliveryQuery): Promise<void> {
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
    sortField: keyof SalesDelivery | null,
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
      const [delivery, lines] = await Promise.all([
        firstValueFrom(this.repository.getById(id)),
        firstValueFrom(this.repository.listLines(id))
      ]);
      this.selectedDeliverySignal.set(delivery);
      this.selectedLinesSignal.set(lines);
    } catch (error: unknown) {
      this.detailErrorSignal.set(toApiError(error));
      this.selectedDeliverySignal.set(null);
      this.selectedLinesSignal.set([]);
    } finally {
      this.detailLoadingSignal.set(false);
    }
  }

  async cancel(delivery: SalesDelivery): Promise<void> {
    const accepted = await this.confirmations.confirm({
      header: 'لغو حواله فروش',
      message: 'آیا از لغو این حواله فروش مطمئن هستید؟',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger'
    });

    if (!accepted) {
      return;
    }

    this.beginOperation();

    try {
      const result = await firstValueFrom(this.commands.cancel(delivery.id));
      this.selectedDeliverySignal.set(result.delivery);
      this.selectedLinesSignal.set(result.lines);
      this.notifications.success('حواله فروش با موفقیت لغو شد.');
      await this.refresh();
    } catch (error: unknown) {
      this.stateSignal.update((state) => ({
        ...state,
        error: toApiError(error)
      }));
    } finally {
      this.endOperation();
    }
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
