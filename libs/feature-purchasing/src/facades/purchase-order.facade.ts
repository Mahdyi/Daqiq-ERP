import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage, AuthorizationService } from '@daqiq/core';
import { ConfirmationService, NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { PurchaseOrderCommandService } from '../data-access/purchase-order-command.service';
import { PurchaseOrderRepository } from '../data-access/purchase-order-repository.service';
import type { PurchaseOrderLine } from '../models/purchase-order-line.model';
import type { PurchaseOrderQuery } from '../models/purchase-order-query.model';
import type { PurchaseOrder } from '../models/purchase-order.model';
import type { PurchaseOrderStatus } from '../models/purchase-order-status.model';

const DEFAULT_QUERY: PurchaseOrderQuery = {
  page: 0,
  pageSize: 20,
  sortField: 'orderDate',
  sortDirection: 'desc'
};

interface PurchaseOrderListState {
  readonly page: ApiPage<PurchaseOrder> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
  readonly requestVersion: number;
}

@Injectable()
export class PurchaseOrderFacade {
  private readonly repository = inject(PurchaseOrderRepository);
  private readonly commands = inject(PurchaseOrderCommandService);
  private readonly authorization = inject(AuthorizationService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmations = inject(ConfirmationService);
  private readonly stateSignal = signal<PurchaseOrderListState>({
    page: null,
    loading: false,
    error: null,
    requestVersion: 0
  });
  private readonly querySignal = signal<PurchaseOrderQuery | null>(null);
  private readonly selectedOrderSignal = signal<PurchaseOrder | null>(null);
  private readonly selectedLinesSignal = signal<readonly PurchaseOrderLine[]>([]);
  private readonly detailLoadingSignal = signal(false);
  private readonly detailErrorSignal = signal<ApiError | null>(null);
  private activeOperationCount = 0;

  readonly state: Signal<PurchaseOrderListState> = this.stateSignal.asReadonly();
  readonly query: Signal<PurchaseOrderQuery | null> = this.querySignal.asReadonly();
  readonly page = computed(() => this.state().page);
  readonly items = computed(() => this.page()?.items ?? []);
  readonly totalItems = computed(() => this.page()?.totalItems ?? 0);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly selectedOrder = this.selectedOrderSignal.asReadonly();
  readonly selectedLines = this.selectedLinesSignal.asReadonly();
  readonly detailLoading = this.detailLoadingSignal.asReadonly();
  readonly detailError = this.detailErrorSignal.asReadonly();
  readonly canCreate = computed(() => this.authorization.hasPermission('purchasing.create'));
  readonly canUpdate = computed(() => this.authorization.hasPermission('purchasing.update'));
  readonly canSubmit = computed(() => this.authorization.hasPermission('purchasing.submit'));
  readonly canApprove = computed(() => this.authorization.hasPermission('purchasing.approve'));
  readonly canCancel = computed(() => this.authorization.hasPermission('purchasing.cancel'));
  readonly canClose = computed(() => this.authorization.hasPermission('purchasing.delete'));

  async loadDefault(): Promise<void> {
    await this.load(DEFAULT_QUERY);
  }

  async load(query: PurchaseOrderQuery): Promise<void> {
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
    sortField: keyof PurchaseOrder | null,
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

  async submit(order: PurchaseOrder): Promise<void> {
    await this.transition(order, 'submit');
  }

  async approve(order: PurchaseOrder): Promise<void> {
    await this.transition(order, 'approve');
  }

  async cancel(order: PurchaseOrder): Promise<void> {
    const accepted = await this.confirmations.confirm({
      header: 'لغو سفارش خرید',
      message: 'آیا از لغو این سفارش خرید مطمئن هستید؟',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger'
    });

    if (!accepted) {
      return;
    }

    await this.transition(order, 'cancel');
  }

  async close(order: PurchaseOrder): Promise<void> {
    await this.transition(order, 'close');
  }

  canEditStatus(status: PurchaseOrderStatus): boolean {
    return status === 'draft' && this.canUpdate();
  }

  canSubmitStatus(status: PurchaseOrderStatus): boolean {
    return status === 'draft' && this.canSubmit();
  }

  canApproveStatus(status: PurchaseOrderStatus): boolean {
    return status === 'submitted' && this.canApprove();
  }

  canCancelStatus(status: PurchaseOrderStatus): boolean {
    return ['draft', 'submitted', 'approved'].includes(status) && this.canCancel();
  }

  canCloseStatus(status: PurchaseOrderStatus): boolean {
    return status === 'approved' && this.canClose();
  }

  private async transition(
    order: PurchaseOrder,
    action: 'submit' | 'approve' | 'cancel' | 'close'
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
    action: 'submit' | 'approve' | 'cancel' | 'close',
    id: string
  ) {
    switch (action) {
      case 'submit':
        return this.commands.submit(id);
      case 'approve':
        return this.commands.approve(id);
      case 'cancel':
        return this.commands.cancel(id);
      case 'close':
        return this.commands.close(id);
    }
  }

  private transitionMessage(action: 'submit' | 'approve' | 'cancel' | 'close'): string {
    switch (action) {
      case 'submit':
        return 'سفارش خرید با موفقیت ارسال شد.';
      case 'approve':
        return 'سفارش خرید با موفقیت تأیید شد.';
      case 'cancel':
        return 'سفارش خرید با موفقیت لغو شد.';
      case 'close':
        return 'سفارش خرید با موفقیت بسته شد.';
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
