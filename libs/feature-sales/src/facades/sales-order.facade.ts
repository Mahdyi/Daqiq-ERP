import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage, AuthorizationService } from '@daqiq/core';
import { ConfirmationService, NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { SalesOrderCommandService } from '../data-access/sales-order-command.service';
import { SalesOrderRepository } from '../data-access/sales-order-repository.service';
import type { SalesOrderLine } from '../models/sales-order-line.model';
import type { SalesOrderQuery } from '../models/sales-order-query.model';
import type { SalesOrder } from '../models/sales-order.model';
import type { SalesOrderStatus } from '../models/sales-order-status.model';

const DEFAULT_QUERY: SalesOrderQuery = {
  page: 0,
  pageSize: 20,
  sortField: 'orderDate',
  sortDirection: 'desc'
};

interface SalesOrderListState {
  readonly page: ApiPage<SalesOrder> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
  readonly requestVersion: number;
}

@Injectable()
export class SalesOrderFacade {
  private readonly repository = inject(SalesOrderRepository);
  private readonly commands = inject(SalesOrderCommandService);
  private readonly authorization = inject(AuthorizationService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmations = inject(ConfirmationService);
  private readonly stateSignal = signal<SalesOrderListState>({
    page: null,
    loading: false,
    error: null,
    requestVersion: 0
  });
  private readonly querySignal = signal<SalesOrderQuery | null>(null);
  private readonly selectedOrderSignal = signal<SalesOrder | null>(null);
  private readonly selectedLinesSignal = signal<readonly SalesOrderLine[]>([]);
  private readonly detailLoadingSignal = signal(false);
  private readonly detailErrorSignal = signal<ApiError | null>(null);
  private activeOperationCount = 0;

  readonly state: Signal<SalesOrderListState> = this.stateSignal.asReadonly();
  readonly query: Signal<SalesOrderQuery | null> = this.querySignal.asReadonly();
  readonly page = computed(() => this.state().page);
  readonly items = computed(() => this.page()?.items ?? []);
  readonly totalItems = computed(() => this.page()?.totalItems ?? 0);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly selectedOrder = this.selectedOrderSignal.asReadonly();
  readonly selectedLines = this.selectedLinesSignal.asReadonly();
  readonly detailLoading = this.detailLoadingSignal.asReadonly();
  readonly detailError = this.detailErrorSignal.asReadonly();
  readonly canCreate = computed(() => this.authorization.hasPermission('salesOrders.create'));
  readonly canUpdate = computed(() => this.authorization.hasPermission('salesOrders.update'));
  readonly canSubmit = computed(() => this.authorization.hasPermission('salesOrders.submit'));
  readonly canConfirm = computed(() => this.authorization.hasPermission('salesOrders.confirm'));
  readonly canCancel = computed(() => this.authorization.hasPermission('salesOrders.cancel'));
  readonly canClose = computed(() => this.authorization.hasPermission('salesOrders.delete'));
  readonly canPostDelivery = computed(() => this.authorization.hasPermission('salesDeliveries.post'));

  async loadDefault(): Promise<void> {
    await this.load(DEFAULT_QUERY);
  }

  async load(query: SalesOrderQuery): Promise<void> {
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
    sortField: keyof SalesOrder | null,
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
      const [order, lines] = await Promise.all([
        firstValueFrom(this.repository.getById(id)),
        firstValueFrom(this.repository.listLines(id))
      ]);
      this.selectedOrderSignal.set(order);
      this.selectedLinesSignal.set(lines);
    } catch (error: unknown) {
      this.detailErrorSignal.set(toApiError(error));
      this.selectedOrderSignal.set(null);
      this.selectedLinesSignal.set([]);
    } finally {
      this.detailLoadingSignal.set(false);
    }
  }

  async submit(order: SalesOrder): Promise<void> {
    await this.transition(order, 'submit');
  }

  async confirm(order: SalesOrder): Promise<void> {
    await this.transition(order, 'confirm');
  }

  async cancel(order: SalesOrder): Promise<void> {
    const accepted = await this.confirmations.confirm({
      header: 'لغو سفارش فروش',
      message: 'آیا از لغو این سفارش فروش مطمئن هستید؟',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger'
    });

    if (!accepted) {
      return;
    }

    await this.transition(order, 'cancel');
  }

  async close(order: SalesOrder): Promise<void> {
    await this.transition(order, 'close');
  }

  canEditStatus(status: SalesOrderStatus): boolean {
    return status === 'draft' && this.canUpdate();
  }

  canSubmitStatus(status: SalesOrderStatus): boolean {
    return status === 'draft' && this.canSubmit();
  }

  canConfirmStatus(status: SalesOrderStatus): boolean {
    return status === 'submitted' && this.canConfirm();
  }

  canCancelStatus(status: SalesOrderStatus): boolean {
    return ['draft', 'submitted', 'confirmed'].includes(status) && this.canCancel();
  }

  canCloseStatus(status: SalesOrderStatus): boolean {
    return status === 'confirmed' && this.canClose();
  }

  canDeliverStatus(status: SalesOrderStatus): boolean {
    return status === 'confirmed' && this.canPostDelivery();
  }

  private async transition(
    order: SalesOrder,
    action: 'submit' | 'confirm' | 'cancel' | 'close'
  ): Promise<void> {
    this.beginOperation();

    try {
      const updated = await firstValueFrom(this.callTransition(action, order.id));
      this.selectedOrderSignal.set(updated);
      this.notifications.success(this.transitionMessage(action));
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

  private callTransition(
    action: 'submit' | 'confirm' | 'cancel' | 'close',
    id: string
  ) {
    switch (action) {
      case 'submit':
        return this.commands.submit(id);
      case 'confirm':
        return this.commands.confirm(id);
      case 'cancel':
        return this.commands.cancel(id);
      case 'close':
        return this.commands.close(id);
    }
  }

  private transitionMessage(action: 'submit' | 'confirm' | 'cancel' | 'close'): string {
    switch (action) {
      case 'submit':
        return 'سفارش فروش با موفقیت ارسال شد.';
      case 'confirm':
        return 'سفارش فروش با موفقیت تأیید شد.';
      case 'cancel':
        return 'سفارش فروش با موفقیت لغو شد.';
      case 'close':
        return 'سفارش فروش با موفقیت بسته شد.';
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

export function toApiError(error: unknown): ApiError {
  return error instanceof ApiError
    ? error
    : new ApiError({
        status: 0,
        code: 'UNKNOWN',
        message: 'خطای غیرمنتظره رخ داد.',
        fieldErrors: [],
        cause: error
      });
}

