import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage } from '@daqiq/core';
import { firstValueFrom } from 'rxjs';

import { AuditLogRepository } from '../data-access/audit-log-repository.service';
import { AuditLog } from '../models/audit-log.model';
import { AuditLogQuery } from '../models/audit-log-query.model';

const DEFAULT_QUERY: AuditLogQuery = {
  page: 0,
  pageSize: 20
};

@Injectable()
export class AuditLogFacade {
  private readonly repository = inject(AuditLogRepository);
  private readonly pageSignal = signal<ApiPage<AuditLog> | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<ApiError | null>(null);
  private readonly querySignal = signal<AuditLogQuery>(DEFAULT_QUERY);
  private readonly selectedLogSignal = signal<AuditLog | null>(null);
  private readonly detailLoadingSignal = signal(false);
  private readonly detailErrorSignal = signal<ApiError | null>(null);

  readonly page: Signal<ApiPage<AuditLog> | null> = this.pageSignal.asReadonly();
  readonly items = computed(() => this.page()?.items ?? []);
  readonly totalItems = computed(() => this.page()?.totalItems ?? 0);
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly selectedLog = this.selectedLogSignal.asReadonly();
  readonly detailLoading = this.detailLoadingSignal.asReadonly();
  readonly detailError = this.detailErrorSignal.asReadonly();

  async loadDefault(): Promise<void> {
    await this.load(DEFAULT_QUERY);
  }

  async search(search: string): Promise<void> {
    await this.load({
      ...this.query(),
      page: 0,
      search: search.trim() || undefined
    });
  }

  async paginate(page: number, pageSize: number): Promise<void> {
    await this.load({
      ...this.query(),
      page,
      pageSize
    });
  }

  async refresh(): Promise<void> {
    await this.load(this.query());
  }

  async load(query: AuditLogQuery): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.querySignal.set(query);

    try {
      this.pageSignal.set(await firstValueFrom(this.repository.list(query)));
    } catch (error: unknown) {
      this.errorSignal.set(this.toApiError(error));
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async loadDetail(id: string): Promise<void> {
    this.detailLoadingSignal.set(true);
    this.detailErrorSignal.set(null);

    try {
      this.selectedLogSignal.set(await firstValueFrom(this.repository.getById(id)));
    } catch (error: unknown) {
      this.selectedLogSignal.set(null);
      this.detailErrorSignal.set(this.toApiError(error));
    } finally {
      this.detailLoadingSignal.set(false);
    }
  }

  private toApiError(error: unknown): ApiError {
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
}
