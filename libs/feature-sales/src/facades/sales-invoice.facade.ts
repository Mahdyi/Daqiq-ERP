import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage, AuthorizationService } from '@daqiq/core';
import { ConfirmationService, NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { SalesInvoiceCommandService } from '../data-access/sales-invoice-command.service';
import { SalesInvoiceRepository } from '../data-access/sales-invoice-repository.service';
import type { SalesInvoiceLine } from '../models/sales-invoice-line.model';
import type { SalesInvoiceQuery } from '../models/sales-invoice-query.model';
import type { SalesInvoiceStatus } from '../models/sales-invoice-status.model';
import type { SalesInvoice } from '../models/sales-invoice.model';
import { toApiError } from './sales-order.facade';

const DEFAULT_QUERY: SalesInvoiceQuery = {
  page: 0,
  pageSize: 20,
  sortField: 'invoiceDate',
  sortDirection: 'desc'
};

interface SalesInvoiceListState {
  readonly page: ApiPage<SalesInvoice> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
  readonly requestVersion: number;
}

@Injectable()
export class SalesInvoiceFacade {
  private readonly repository = inject(SalesInvoiceRepository);
  private readonly commands = inject(SalesInvoiceCommandService);
  private readonly authorization = inject(AuthorizationService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmations = inject(ConfirmationService);
  private readonly stateSignal = signal<SalesInvoiceListState>({
    page: null,
    loading: false,
    error: null,
    requestVersion: 0
  });
  private readonly querySignal = signal<SalesInvoiceQuery | null>(null);
  private readonly selectedInvoiceSignal = signal<SalesInvoice | null>(null);
  private readonly selectedLinesSignal = signal<readonly SalesInvoiceLine[]>([]);
  private readonly detailLoadingSignal = signal(false);
  private readonly detailErrorSignal = signal<ApiError | null>(null);
  private activeOperationCount = 0;

  readonly state: Signal<SalesInvoiceListState> = this.stateSignal.asReadonly();
  readonly query: Signal<SalesInvoiceQuery | null> = this.querySignal.asReadonly();
  readonly page = computed(() => this.state().page);
  readonly items = computed(() => this.page()?.items ?? []);
  readonly totalItems = computed(() => this.page()?.totalItems ?? 0);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly selectedInvoice = this.selectedInvoiceSignal.asReadonly();
  readonly selectedLines = this.selectedLinesSignal.asReadonly();
  readonly detailLoading = this.detailLoadingSignal.asReadonly();
  readonly detailError = this.detailErrorSignal.asReadonly();
  readonly canIssue = computed(() => this.authorization.hasPermission('salesInvoices.issue'));
  readonly canCancel = computed(() => this.authorization.hasPermission('salesInvoices.cancel'));

  async loadDefault(): Promise<void> {
    await this.load(DEFAULT_QUERY);
  }

  async load(query: SalesInvoiceQuery): Promise<void> {
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

  async sort(sortField: keyof SalesInvoice | null, sortDirection: 'asc' | 'desc' | null): Promise<void> {
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

  async issue(invoice: SalesInvoice): Promise<void> {
    if (!this.canIssueStatus(invoice.statusCode)) {
      return;
    }

    await this.transition(invoice.id, 'issue');
  }

  async cancel(invoice: SalesInvoice): Promise<void> {
    if (!this.canCancelStatus(invoice.statusCode)) {
      return;
    }

    const accepted = await this.confirmations.confirm({
      header: 'لغو فاکتور فروش',
      message: 'آیا از لغو این فاکتور فروش مطمئن هستید؟',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger'
    });

    if (!accepted) {
      return;
    }

    await this.transition(invoice.id, 'cancel');
  }

  canIssueStatus(status: SalesInvoiceStatus): boolean {
    return status === 'draft' && this.canIssue();
  }

  canCancelStatus(status: SalesInvoiceStatus): boolean {
    return ['draft', 'issued'].includes(status) && this.canCancel();
  }

  private async transition(id: string, action: 'issue' | 'cancel'): Promise<void> {
    this.beginOperation();

    try {
      const result = await firstValueFrom(
        action === 'issue' ? this.commands.issue(id) : this.commands.cancel(id)
      );
      this.selectedInvoiceSignal.set(result.invoice);
      this.selectedLinesSignal.set(result.lines);
      this.notifications.success(
        action === 'issue'
          ? 'فاکتور فروش با موفقیت صادر شد.'
          : 'فاکتور فروش با موفقیت لغو شد.'
      );
      await this.refresh();
    } catch (error: unknown) {
      this.stateSignal.update((state) => ({
        ...state,
        error: toApiError(error)
      }));
      this.detailErrorSignal.set(toApiError(error));
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
