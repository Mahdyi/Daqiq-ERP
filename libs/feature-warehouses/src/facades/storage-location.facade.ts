import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, AuthorizationService, RuntimeConfigService, RuntimeLookupValue } from '@daqiq/core';
import { CrudFacadeBase } from '@daqiq/shared';
import { ConfirmationService, FormFieldOption, NotificationService } from '@daqiq/ui';
import { firstValueFrom, forkJoin } from 'rxjs';

import { createStorageLocationFormFields } from '../config/storage-location-form.config';
import { StorageLocationRepository } from '../data-access/storage-location-repository.service';
import { WarehouseRepository } from '../data-access/warehouse-repository.service';
import type { CreateStorageLocationPostgrestRequest } from '../dto/create-storage-location-postgrest-request.dto';
import type { UpdateStorageLocationPostgrestRequest } from '../dto/update-storage-location-postgrest-request.dto';
import {
  mapFormValueToCreateStorageLocationRequest,
  mapFormValueToUpdateStorageLocationRequest
} from '../mappers/storage-location-form.mapper';
import type { StorageLocationFormValue } from '../models/storage-location-form-value.model';
import type { StorageLocationQuery } from '../models/storage-location-query.model';
import type { StorageLocation } from '../models/storage-location.model';
import type { Warehouse } from '../models/warehouse.model';

const DEFAULT_QUERY: StorageLocationQuery = {
  page: 0,
  pageSize: 20,
  sortField: 'createdAt',
  sortDirection: 'desc'
};

@Injectable()
export class StorageLocationFacade extends CrudFacadeBase<
  StorageLocation,
  string,
  CreateStorageLocationPostgrestRequest,
  UpdateStorageLocationPostgrestRequest,
  StorageLocationQuery
> {
  protected override readonly resource = inject(StorageLocationRepository);

  private readonly warehouseRepository = inject(WarehouseRepository);
  private readonly authorization = inject(AuthorizationService);
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmations = inject(ConfirmationService);
  private readonly editingLocationSignal = signal<StorageLocation | null>(null);
  private readonly editorLoadingSignal = signal(false);
  private readonly editorErrorSignal = signal<ApiError | null>(null);
  private readonly submittingSignal = signal(false);
  private readonly referenceLoadingSignal = signal(false);
  private readonly lookupValuesSignal = signal<readonly RuntimeLookupValue[]>([]);
  private readonly warehousesSignal = signal<readonly Warehouse[]>([]);
  private readonly locationsSignal = signal<readonly StorageLocation[]>([]);

  readonly editingLocation: Signal<StorageLocation | null> = this.editingLocationSignal.asReadonly();
  readonly editorLoading: Signal<boolean> = this.editorLoadingSignal.asReadonly();
  readonly editorError: Signal<ApiError | null> = this.editorErrorSignal.asReadonly();
  readonly submitting: Signal<boolean> = this.submittingSignal.asReadonly();
  readonly referenceLoading: Signal<boolean> = this.referenceLoadingSignal.asReadonly();
  readonly canCreate = computed(() => this.authorization.hasPermission('storageLocations.create'));
  readonly canUpdate = computed(() => this.authorization.hasPermission('storageLocations.update'));
  readonly canDelete = computed(() => this.authorization.hasPermission('storageLocations.delete'));
  readonly canView = computed(() => this.authorization.hasPermission('storageLocations.view'));

  readonly warehouseOptions = computed(() =>
    this.warehousesSignal()
      .filter((warehouse) => warehouse.active)
      .map((warehouse) => ({
        label: `${warehouse.code} - ${warehouse.name}`,
        value: warehouse.id
      }))
  );
  readonly locationTypeOptions = computed(() => this.optionsForType('storage_location_type'));
  readonly parentLocationOptions = computed(() => {
    const editingId = this.editingLocation()?.id ?? null;

    return this.locationsSignal()
      .filter((location) => location.active && location.id !== editingId)
      .map((location) => ({
        label: `${location.code} - ${location.name}`,
        value: location.id
      }));
  });
  readonly formFields = computed(() =>
    createStorageLocationFormFields({
      warehouseOptions: this.warehouseOptions(),
      locationTypeOptions: this.locationTypeOptions(),
      parentLocationOptions: this.parentLocationOptions()
    })
  );

  async loadDefault(): Promise<void> {
    await Promise.all([
      this.loadReferenceData(),
      this.load(DEFAULT_QUERY)
    ]);
  }

  async loadReferenceData(): Promise<void> {
    this.referenceLoadingSignal.set(true);

    try {
      const [locationTypes, warehouses, locations] = await firstValueFrom(
        forkJoin([
          this.runtimeConfig.getLookupValues('storage_location_type'),
          this.warehouseRepository.list({
            page: 0,
            pageSize: 500,
            active: true,
            sortField: 'code',
            sortDirection: 'asc'
          }),
          this.resource.list({
            page: 0,
            pageSize: 500,
            active: true,
            sortField: 'code',
            sortDirection: 'asc'
          })
        ])
      );

      this.lookupValuesSignal.set(locationTypes);
      this.warehousesSignal.set(warehouses.items);
      this.locationsSignal.set(locations.items);
    } catch (error: unknown) {
      this.editorErrorSignal.set(this.toApiError(error));
    } finally {
      this.referenceLoadingSignal.set(false);
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

  async sort(
    sortField: keyof StorageLocation | null,
    sortDirection: 'asc' | 'desc' | null
  ): Promise<void> {
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
      await this.loadReferenceData();
      this.editingLocationSignal.set(await firstValueFrom(this.resource.getById(id)));
    } catch (error: unknown) {
      this.editorErrorSignal.set(this.toApiError(error));
      this.editingLocationSignal.set(null);
    } finally {
      this.editorLoadingSignal.set(false);
    }
  }

  async createLocation(value: Readonly<StorageLocationFormValue>): Promise<boolean> {
    this.submittingSignal.set(true);

    try {
      const result = await this.create(mapFormValueToCreateStorageLocationRequest(value));

      if (result.success) {
        this.notifications.success('موقعیت انبار با موفقیت ایجاد شد.');
        return true;
      }

      return false;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  async updateLocation(id: string, value: Readonly<StorageLocationFormValue>): Promise<boolean> {
    this.submittingSignal.set(true);

    try {
      const result = await this.update(id, mapFormValueToUpdateStorageLocationRequest(value));

      if (result.success) {
        this.notifications.success('اطلاعات موقعیت انبار با موفقیت به‌روزرسانی شد.');
        return true;
      }

      return false;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  async deleteLocation(location: StorageLocation): Promise<void> {
    const accepted = await this.confirmations.confirm({
      header: 'حذف موقعیت انبار',
      message: 'آیا از حذف این موقعیت انبار مطمئن هستید؟',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger'
    });

    if (!accepted) {
      return;
    }

    const result = await this.delete(location.id);

    if (result.success) {
      this.notifications.success('موقعیت انبار با موفقیت حذف شد.');
      await this.loadReferenceData();
    }
  }

  lookupLabel(id: string | null): string {
    if (!id) {
      return '—';
    }

    return this.lookupValuesSignal().find((value) => value.id === id)?.label ?? id;
  }

  warehouseLabel(id: string): string {
    const warehouse = this.warehousesSignal().find((item) => item.id === id);
    return warehouse ? `${warehouse.code} - ${warehouse.name}` : id;
  }

  locationLabel(id: string | null): string {
    if (!id) {
      return '—';
    }

    const location = this.locationsSignal().find((item) => item.id === id);
    return location ? `${location.code} - ${location.name}` : id;
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
