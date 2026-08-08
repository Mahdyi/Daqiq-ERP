import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage, AuthorizationService } from '@daqiq/core';
import { ConfirmationService, NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { SupplierInvoiceCommandService } from '../data-access/supplier-invoice-command.service';
import { SupplierInvoiceRepository } from '../data-access/supplier-invoice-repository.service';
import type { SupplierInvoiceLine } from '../models/supplier-invoice-line.model';
import type { SupplierInvoiceQuery } from '../models/supplier-invoice-query.model';
import type { SupplierInvoiceStatus } from '../models/supplier-invoice-status.model';
import type { SupplierInvoice } from '../models/supplier-invoice.model';
import { toApiError } from './purchase-order.facade';

const DEFAULT_QUERY: SupplierInvoiceQuery = {
  page: 0,
  pageSize: 20,
  sortField: 'invoiceDate',
  sortDirection: 'desc'
};

interface SupplierInvoiceListState {
  readonly page: ApiPage<SupplierInvoice> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
  readonly requestVersion: number;
}

@Injectable()
export class SupplierInvoiceFacade {
  private readonly repository = inject(SupplierInvoiceRepository);
  private readonly commands = inject(SupplierInvoiceCommandService);
  private readonly authorization = inject(AuthorizationService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmations = inject(ConfirmationService);
  private readonly stateSignal = signal<SupplierInvoiceListState>({
    page: null,
    loading: false,
    error: null,
    requestVersion: 0
  });
  private readonly querySignal = signal<SupplierInvoiceQuery | null>(null);
  private readonly selectedInvoiceSignal = signal<SupplierInvoice | null>(null);
  private readonly selectedLinesSignal = signal<readonly SupplierInvoiceLine[]>([]);
  private readonly detailLoadingSignal = signal(false);
  private readonly detailErrorSignal = signal<ApiError | null>(null);
  private activeOperationCount = 0;

  readonly state: Signal<SupplierInvoiceListState> = this.stateSignal.asReadonly();
  readonly query: Signal<SupplierInvoiceQuery | null> = this.querySignal.asReadonly();
  readonly page = computed(() => this.state().page);
  readonly items = computed(() => this.page()?.items ?? []);
  readonly totalItems = computed(() => this.page()?.totalItems ?? 0);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly selectedInvoice = this.selectedInvoiceSignal.asReadonly();
  readonly selectedLines = this.selectedLinesSignal.asReadonly();
  readonly detailLoading = this.detailLoadingSignal.asReadonly();
  readonly detailError = this.detailErrorSignal.asReadonly();
  readonly canPost = computed(() => this.authorization.hasPermission('supplierInvoices.post'));
  readonly canCancel = computed(() => this.authorization.hasPermission('supplierInvoices.cancel'));

  async loadDefault(): Promise<void> {
    await this.load(DEFAULT_QUERY);
  }

  async load(query: SupplierInvoiceQuery): Promise<void> {
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
    sortField: keyof SupplierInvoice | null,
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
      const [invoice, lines] = await Promise.all([
        firstValueFrom(this.repository.getById(id)),
        firstValueFrom(this.repository.listLines(id))
      ]);
      this.selectedInvoiceSignal.set(invoice);
      this.selectedLinesSignal.set(lines);
    } catch (error: unknown) {
      this.detailErrorSignal.set(toApiError(error));
      this.selectedInvoiceSignal.set(null);
      this.selectedLinesSignal.set([]);
    } finally {
      this.detailLoadingSignal.set(false);
    }
  }

  async post(invoice: SupplierInvoice): Promise<void> {
    if (!this.canPostStatus(invoice.statusCode)) {
      return;
    }

    await this.transition(invoice.id, 'post');
  }

  async cancel(invoice: SupplierInvoice): Promise<void> {
    if (!this.canCancelStatus(invoice.statusCode)) {
      return;
    }

    const accepted = await this.confirmations.confirm({
      header: 'لغو فاکتور تأمین‌کننده',
      message: 'آیا از لغو این فاکتور تأمین‌کننده مطمئن هستید؟',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger'
    });

    if (!accepted) {
      return;
    }

    await this.transition(invoice.id, 'cancel');
  }

  canPostStatus(status: SupplierInvoiceStatus): boolean {
    return status === 'draft' && this.canPost();
  }

  canCancelStatus(status: SupplierInvoiceStatus): boolean {
    return ['draft', 'posted'].includes(status) && this.canCancel();
  }

  private async transition(id: string, action: 'post' | 'cancel'): Promise<void> {
    this.beginOperation();

    try {
      const result = await firstValueFrom(
        action === 'post' ? this.commands.post(id) : this.commands.cancel(id)
      );
      this.selectedInvoiceSignal.set(result.invoice);
      this.selectedLinesSignal.set(result.lines);
      this.notifications.success(
        action === 'post'
          ? 'فاکتور تأمین‌کننده با موفقیت ثبت شد.'
          : 'فاکتور تأمین‌کننده با موفقیت لغو شد.'
      );
      await this.refresh();
    } catch (error: unknown) {
      const apiError = toApiError(error);
      this.stateSignal.update((state) => ({
        ...state,
        error: apiError
      }));
      this.detailErrorSignal.set(apiError);
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
