import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, AuthorizationService, RuntimeConfigService, RuntimeLookupValue } from '@daqiq/core';
import { CrudFacadeBase } from '@daqiq/shared';
import { ConfirmationService, FormFieldOption, NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { createWarehouseFormFields } from '../config/warehouse-form.config';
import { WarehouseRepository } from '../data-access/warehouse-repository.service';
import type { CreateWarehousePostgrestRequest } from '../dto/create-warehouse-postgrest-request.dto';
import type { UpdateWarehousePostgrestRequest } from '../dto/update-warehouse-postgrest-request.dto';
import {
  mapFormValueToCreateWarehouseRequest,
  mapFormValueToUpdateWarehouseRequest
} from '../mappers/warehouse-form.mapper';
import type { WarehouseFormValue } from '../models/warehouse-form-value.model';
import type { WarehouseQuery } from '../models/warehouse-query.model';
import type { Warehouse } from '../models/warehouse.model';

const DEFAULT_QUERY: WarehouseQuery = {
  page: 0,
  pageSize: 20,
  sortField: 'createdAt',
  sortDirection: 'desc'
};

@Injectable()
export class WarehouseFacade extends CrudFacadeBase<
  Warehouse,
  string,
  CreateWarehousePostgrestRequest,
  UpdateWarehousePostgrestRequest,
  WarehouseQuery
> {
  protected override readonly resource = inject(WarehouseRepository);

  private readonly authorization = inject(AuthorizationService);
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmations = inject(ConfirmationService);
  private readonly editingWarehouseSignal = signal<Warehouse | null>(null);
  private readonly editorLoadingSignal = signal(false);
  private readonly editorErrorSignal = signal<ApiError | null>(null);
  private readonly submittingSignal = signal(false);
  private readonly lookupsLoadingSignal = signal(false);
  private readonly lookupValuesSignal = signal<readonly RuntimeLookupValue[]>([]);

  readonly editingWarehouse: Signal<Warehouse | null> = this.editingWarehouseSignal.asReadonly();
  readonly editorLoading: Signal<boolean> = this.editorLoadingSignal.asReadonly();
  readonly editorError: Signal<ApiError | null> = this.editorErrorSignal.asReadonly();
  readonly submitting: Signal<boolean> = this.submittingSignal.asReadonly();
  readonly lookupsLoading: Signal<boolean> = this.lookupsLoadingSignal.asReadonly();
  readonly canCreate = computed(() => this.authorization.hasPermission('warehouses.create'));
  readonly canUpdate = computed(() => this.authorization.hasPermission('warehouses.update'));
  readonly canDelete = computed(() => this.authorization.hasPermission('warehouses.delete'));
  readonly canView = computed(() => this.authorization.hasPermission('warehouses.view'));

  readonly warehouseTypeOptions = computed(() => this.optionsForType('warehouse_type'));
  readonly formFields = computed(() => createWarehouseFormFields(this.warehouseTypeOptions()));

  async loadDefault(): Promise<void> {
    await Promise.all([
      this.loadLookups(),
      this.load(DEFAULT_QUERY)
    ]);
  }

  async loadLookups(): Promise<void> {
    this.lookupsLoadingSignal.set(true);

    try {
      const warehouseTypes = await firstValueFrom(
        this.runtimeConfig.getLookupValues('warehouse_type')
      );
      this.lookupValuesSignal.set(warehouseTypes);
    } catch (error: unknown) {
      this.editorErrorSignal.set(this.toApiError(error));
    } finally {
      this.lookupsLoadingSignal.set(false);
    }
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

  async sort(sortField: keyof Warehouse | null, sortDirection: 'asc' | 'desc' | null): Promise<void> {
    await this.load({
      ...(this.query() ?? DEFAULT_QUERY),
      page: 0,
      sortField: sortField ?? undefined,
      sortDirection: sortDirection ?? undefined
    });
  }

  async loadForEdit(id: string): Promise<void> {
    this.editorLoadingSignal.set(true);
    this.editorErrorSignal.set(null);

    try {
      await this.loadLookups();
      this.editingWarehouseSignal.set(await firstValueFrom(this.resource.getById(id)));
    } catch (error: unknown) {
      this.editorErrorSignal.set(this.toApiError(error));
      this.editingWarehouseSignal.set(null);
    } finally {
      this.editorLoadingSignal.set(false);
    }
  }

  async createWarehouse(value: Readonly<WarehouseFormValue>): Promise<boolean> {
    this.submittingSignal.set(true);

    try {
      const result = await this.create(mapFormValueToCreateWarehouseRequest(value));

      if (result.success) {
        this.notifications.success('انبار با موفقیت ایجاد شد.');
        return true;
      }

      return false;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  async updateWarehouse(id: string, value: Readonly<WarehouseFormValue>): Promise<boolean> {
    this.submittingSignal.set(true);

    try {
      const result = await this.update(id, mapFormValueToUpdateWarehouseRequest(value));

      if (result.success) {
        this.notifications.success('اطلاعات انبار با موفقیت به‌روزرسانی شد.');
        return true;
      }

      return false;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  async deleteWarehouse(warehouse: Warehouse): Promise<void> {
    const accepted = await this.confirmations.confirm({
      header: 'حذف انبار',
      message: 'آیا از حذف این انبار مطمئن هستید؟',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger'
    });

    if (!accepted) {
      return;
    }

    const result = await this.delete(warehouse.id);

    if (result.success) {
      this.notifications.success('انبار با موفقیت حذف شد.');
    }
  }

  lookupLabel(id: string | null): string {
    if (!id) {
      return '—';
    }

    return this.lookupValuesSignal().find((value) => value.id === id)?.label ?? id;
  }

  private optionsForType(typeCode: string): readonly FormFieldOption[] {
    return this.lookupValuesSignal()
      .filter((value) => value.lookupTypeCode === typeCode && value.active)
      .map((value) => ({
        label: value.label,
        value: value.id
      }));
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
