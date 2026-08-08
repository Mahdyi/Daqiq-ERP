import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage, AuthorizationService } from '@daqiq/core';
import { ConfirmationService, NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { JournalEntryCommandService } from '../data-access/journal-entry-command.service';
import { JournalEntryRepository } from '../data-access/journal-entry-repository.service';
import type { JournalEntryQuery } from '../models/accounting-query.model';
import type { JournalEntryLine } from '../models/journal-entry-line.model';
import type { JournalEntry } from '../models/journal-entry.model';
import { toApiError } from './accounting-error.util';

const DEFAULT_QUERY: JournalEntryQuery = {
  page: 0,
  pageSize: 20,
  sortField: 'journalDate',
  sortDirection: 'desc'
};

interface JournalEntryState {
  readonly page: ApiPage<JournalEntry> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
  readonly requestVersion: number;
}

@Injectable()
export class JournalEntryFacade {
  private readonly repository = inject(JournalEntryRepository);
  private readonly commands = inject(JournalEntryCommandService);
  private readonly authorization = inject(AuthorizationService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmations = inject(ConfirmationService);
  private readonly stateSignal = signal<JournalEntryState>({
    page: null,
    loading: false,
    error: null,
    requestVersion: 0
  });
  private readonly querySignal = signal<JournalEntryQuery | null>(null);
  private readonly selectedEntrySignal = signal<JournalEntry | null>(null);
  private readonly selectedLinesSignal = signal<readonly JournalEntryLine[]>([]);
  private readonly detailLoadingSignal = signal(false);
  private readonly detailErrorSignal = signal<ApiError | null>(null);

  readonly state: Signal<JournalEntryState> = this.stateSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly page = computed(() => this.state().page);
  readonly items = computed(() => this.page()?.items ?? []);
  readonly totalItems = computed(() => this.page()?.totalItems ?? 0);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly selectedEntry = this.selectedEntrySignal.asReadonly();
  readonly selectedLines = this.selectedLinesSignal.asReadonly();
  readonly detailLoading = this.detailLoadingSignal.asReadonly();
  readonly detailError = this.detailErrorSignal.asReadonly();
  readonly canPost = computed(() => this.authorization.hasPermission('accounting.post'));
  readonly canCancel = computed(() => this.authorization.hasPermission('accounting.cancel'));

  async loadDefault(): Promise<void> {
    await this.load(DEFAULT_QUERY);
  }

  async load(query: JournalEntryQuery): Promise<void> {
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
    await this.load({
      ...(this.query() ?? DEFAULT_QUERY),
      page: 0,
      search: search.trim() || undefined
    });
  }

  async loadDetail(id: string): Promise<void> {
    this.detailLoadingSignal.set(true);
    this.detailErrorSignal.set(null);

    try {
      const [entry, lines] = await Promise.all([
        firstValueFrom(this.repository.getById(id)),
        firstValueFrom(this.repository.listLines(id))
      ]);
      this.selectedEntrySignal.set(entry);
      this.selectedLinesSignal.set(lines);
    } catch (error: unknown) {
      this.detailErrorSignal.set(toApiError(error));
      this.selectedEntrySignal.set(null);
      this.selectedLinesSignal.set([]);
    } finally {
      this.detailLoadingSignal.set(false);
    }
  }

  canPostEntry(entry: JournalEntry): boolean {
    return entry.statusCode === 'draft' && this.canPost();
  }

  canCancelEntry(entry: JournalEntry): boolean {
    return entry.statusCode === 'draft' && this.canCancel();
  }

  async post(entry: JournalEntry): Promise<void> {
    if (!this.canPostEntry(entry)) {
      return;
    }

    await this.transition(entry.id, 'post');
  }

  async cancel(entry: JournalEntry): Promise<void> {
    if (!this.canCancelEntry(entry)) {
      return;
    }

    const accepted = await this.confirmations.confirm({
      header: 'لغو سند حسابداری',
      message: 'آیا از لغو این سند حسابداری مطمئن هستید؟',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger'
    });

    if (!accepted) {
      return;
    }

    await this.transition(entry.id, 'cancel');
  }

  private async transition(id: string, action: 'post' | 'cancel'): Promise<void> {
    this.stateSignal.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const result = await firstValueFrom(
        action === 'post' ? this.commands.post(id) : this.commands.cancel(id)
      );
      this.selectedEntrySignal.set(result.entry);
      this.selectedLinesSignal.set(result.lines);
      this.notifications.success(
        action === 'post'
          ? 'سند حسابداری با موفقیت ثبت شد.'
          : 'سند حسابداری با موفقیت لغو شد.'
      );
      await this.refresh();
    } catch (error: unknown) {
      const apiError = toApiError(error);
      this.stateSignal.update((state) => ({ ...state, error: apiError }));
      this.detailErrorSignal.set(apiError);
    } finally {
      this.stateSignal.update((state) => ({ ...state, loading: false }));
    }
  }
}
