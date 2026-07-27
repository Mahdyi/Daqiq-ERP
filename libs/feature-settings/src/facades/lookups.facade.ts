import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, ApiPage, AuthorizationService } from '@daqiq/core';
import { ConfirmationService, NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { LookupsRepository } from '../data-access/lookups-repository.service';
import type { CreateLookupValueRequest } from '../dto/create-lookup-value-request.dto';
import type { UpdateLookupValueRequest } from '../dto/update-lookup-value-request.dto';
import type { LookupTypeQuery, LookupValueQuery } from '../models/lookup-query.model';
import type { LookupType } from '../models/lookup-type.model';
import type { LookupValue } from '../models/lookup-value.model';

const DEFAULT_TYPE_QUERY: LookupTypeQuery = {
  page: 0,
  pageSize: 50,
  active: true
};

@Injectable()
export class LookupsFacade {
  private readonly repository = inject(LookupsRepository);
  private readonly authorization = inject(AuthorizationService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmations = inject(ConfirmationService);
  private readonly typePageSignal = signal<ApiPage<LookupType> | null>(null);
  private readonly valuePageSignal = signal<ApiPage<LookupValue> | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly valuesLoadingSignal = signal(false);
  private readonly submittingSignal = signal(false);
  private readonly errorSignal = signal<ApiError | null>(null);
  private readonly selectedTypeCodeSignal = signal<string | null>(null);
  private readonly valueQuerySignal = signal<LookupValueQuery | null>(null);

  readonly typePage: Signal<ApiPage<LookupType> | null> = this.typePageSignal.asReadonly();
  readonly valuePage: Signal<ApiPage<LookupValue> | null> = this.valuePageSignal.asReadonly();
  readonly types = computed(() => this.typePage()?.items ?? []);
  readonly values = computed(() => this.valuePage()?.items ?? []);
  readonly totalValues = computed(() => this.valuePage()?.totalItems ?? 0);
  readonly loading = this.loadingSignal.asReadonly();
  readonly valuesLoading = this.valuesLoadingSignal.asReadonly();
  readonly submitting = this.submittingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly selectedTypeCode = this.selectedTypeCodeSignal.asReadonly();
  readonly valueQuery = this.valueQuerySignal.asReadonly();
  readonly canCreate = computed(() => this.authorization.hasPermission('lookups.create'));
  readonly canUpdate = computed(() => this.authorization.hasPermission('lookups.update'));
  readonly canDelete = computed(() => this.authorization.hasPermission('lookups.delete'));

  async loadDefault(): Promise<void> {
    await this.loadTypes(DEFAULT_TYPE_QUERY);
  }

  async loadTypes(query: LookupTypeQuery): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const page = await firstValueFrom(this.repository.listTypes(query));
      this.typePageSignal.set(page);

      if (!this.selectedTypeCode() && page.items.length > 0) {
        await this.selectType(page.items[0].code);
      }
    } catch (error: unknown) {
      this.errorSignal.set(this.toApiError(error));
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async selectType(typeCode: string): Promise<void> {
    const query: LookupValueQuery = {
      lookupTypeCode: typeCode,
      page: 0,
      pageSize: 20
    };

    this.selectedTypeCodeSignal.set(typeCode);
    await this.loadValues(query);
  }

  async searchValues(search: string): Promise<void> {
    const current = this.valueQuery();

    if (!current) {
      return;
    }

    await this.loadValues({
      ...current,
      page: 0,
      search: search.trim() || undefined
    });
  }

  async paginateValues(page: number, pageSize: number): Promise<void> {
    const current = this.valueQuery();

    if (!current) {
      return;
    }

    await this.loadValues({
      ...current,
      page,
      pageSize
    });
  }

  async refreshValues(): Promise<void> {
    const current = this.valueQuery();

    if (current) {
      await this.loadValues(current);
    }
  }

  async createValue(request: CreateLookupValueRequest): Promise<boolean> {
    this.submittingSignal.set(true);

    try {
      await firstValueFrom(this.repository.createValue(request));
      await this.refreshValues();
      this.notifications.success('مقدار مرجع با موفقیت ایجاد شد.');
      return true;
    } catch (error: unknown) {
      this.errorSignal.set(this.toApiError(error));
      return false;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  async updateValue(id: string, request: UpdateLookupValueRequest): Promise<boolean> {
    this.submittingSignal.set(true);

    try {
      await firstValueFrom(this.repository.updateValue(id, request));
      await this.refreshValues();
      this.notifications.success('مقدار مرجع با موفقیت به‌روزرسانی شد.');
      return true;
    } catch (error: unknown) {
      this.errorSignal.set(this.toApiError(error));
      return false;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  async toggleActive(value: LookupValue): Promise<void> {
    const nextActive = !value.active;
    const accepted = await this.confirmations.confirm({
      header: nextActive ? 'فعال‌سازی مقدار مرجع' : 'غیرفعال‌سازی مقدار مرجع',
      message: nextActive
        ? 'آیا از فعال‌سازی این مقدار مرجع مطمئن هستید؟'
        : 'آیا از غیرفعال‌سازی این مقدار مرجع مطمئن هستید؟',
      icon: 'pi pi-exclamation-triangle'
    });

    if (!accepted) {
      return;
    }

    this.submittingSignal.set(true);

    try {
      await firstValueFrom(this.repository.setValueActive(value.id, nextActive));
      await this.refreshValues();
      this.notifications.success(
        nextActive ? 'مقدار مرجع با موفقیت فعال شد.' : 'مقدار مرجع با موفقیت غیرفعال شد.'
      );
    } catch (error: unknown) {
      this.errorSignal.set(this.toApiError(error));
    } finally {
      this.submittingSignal.set(false);
    }
  }

  private async loadValues(query: LookupValueQuery): Promise<void> {
    this.valuesLoadingSignal.set(true);
    this.errorSignal.set(null);
    this.valueQuerySignal.set(query);

    try {
      this.valuePageSignal.set(await firstValueFrom(this.repository.listValues(query)));
    } catch (error: unknown) {
      this.errorSignal.set(this.toApiError(error));
    } finally {
      this.valuesLoadingSignal.set(false);
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
