import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, AuthorizationService, RuntimeConfigService, RuntimeLookupValue } from '@daqiq/core';
import { CrudFacadeBase } from '@daqiq/shared';
import { ConfirmationService, FormFieldOption, NotificationService } from '@daqiq/ui';
import { firstValueFrom, forkJoin } from 'rxjs';

import { createSupplierFormFields } from '../config/supplier-form.config';
import { SupplierRepository } from '../data-access/supplier-repository.service';
import type { CreateSupplierPostgrestRequest } from '../dto/create-supplier-postgrest-request.dto';
import type { UpdateSupplierPostgrestRequest } from '../dto/update-supplier-postgrest-request.dto';
import {
  mapFormValueToCreateSupplierRequest,
  mapFormValueToUpdateSupplierRequest
} from '../mappers/supplier-form.mapper';
import type { SupplierFormValue } from '../models/supplier-form-value.model';
import type { SupplierQuery } from '../models/supplier-query.model';
import type { Supplier } from '../models/supplier.model';

const DEFAULT_QUERY: SupplierQuery = {
  page: 0,
  pageSize: 20,
  sortField: 'createdAt',
  sortDirection: 'desc'
};

@Injectable()
export class SupplierFacade extends CrudFacadeBase<
  Supplier,
  string,
  CreateSupplierPostgrestRequest,
  UpdateSupplierPostgrestRequest,
  SupplierQuery
> {
  protected override readonly resource = inject(SupplierRepository);

  private readonly authorization = inject(AuthorizationService);
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmations = inject(ConfirmationService);
  private readonly editingSupplierSignal = signal<Supplier | null>(null);
  private readonly editorLoadingSignal = signal(false);
  private readonly editorErrorSignal = signal<ApiError | null>(null);
  private readonly submittingSignal = signal(false);
  private readonly lookupsLoadingSignal = signal(false);
  private readonly lookupValuesSignal = signal<readonly RuntimeLookupValue[]>([]);

  readonly editingSupplier: Signal<Supplier | null> = this.editingSupplierSignal.asReadonly();
  readonly editorLoading: Signal<boolean> = this.editorLoadingSignal.asReadonly();
  readonly editorError: Signal<ApiError | null> = this.editorErrorSignal.asReadonly();
  readonly submitting: Signal<boolean> = this.submittingSignal.asReadonly();
  readonly lookupsLoading: Signal<boolean> = this.lookupsLoadingSignal.asReadonly();
  readonly canCreate = computed(() => this.authorization.hasPermission('suppliers.create'));
  readonly canUpdate = computed(() => this.authorization.hasPermission('suppliers.update'));
  readonly canDelete = computed(() => this.authorization.hasPermission('suppliers.delete'));
  readonly canView = computed(() => this.authorization.hasPermission('suppliers.view'));

  readonly supplierGroupOptions = computed(() => this.optionsForType('supplier_group'));
  readonly currencyOptions = computed(() => this.optionsForType('currency'));
  readonly formFields = computed(() =>
    createSupplierFormFields({
      supplierGroupOptions: this.supplierGroupOptions(),
      currencyOptions: this.currencyOptions()
    })
  );

  async loadDefault(): Promise<void> {
    await Promise.all([
      this.loadLookups(),
      this.load(DEFAULT_QUERY)
    ]);
  }

  async loadLookups(): Promise<void> {
    this.lookupsLoadingSignal.set(true);

    try {
      const [supplierGroups, currencies] = await firstValueFrom(
        forkJoin([
          this.runtimeConfig.getLookupValues('supplier_group'),
          this.runtimeConfig.getLookupValues('currency')
        ])
      );
      this.lookupValuesSignal.set([...supplierGroups, ...currencies]);
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

  async sort(sortField: keyof Supplier | null, sortDirection: 'asc' | 'desc' | null): Promise<void> {
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
      this.editingSupplierSignal.set(await firstValueFrom(this.resource.getById(id)));
    } catch (error: unknown) {
      this.editorErrorSignal.set(this.toApiError(error));
      this.editingSupplierSignal.set(null);
    } finally {
      this.editorLoadingSignal.set(false);
    }
  }

  async createSupplier(value: Readonly<SupplierFormValue>): Promise<boolean> {
    this.submittingSignal.set(true);

    try {
      const result = await this.create(mapFormValueToCreateSupplierRequest(value));

      if (result.success) {
        this.notifications.success('تأمین‌کننده با موفقیت ایجاد شد.');
        return true;
      }

      return false;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  async updateSupplier(id: string, value: Readonly<SupplierFormValue>): Promise<boolean> {
    this.submittingSignal.set(true);

    try {
      const result = await this.update(id, mapFormValueToUpdateSupplierRequest(value));

      if (result.success) {
        this.notifications.success('اطلاعات تأمین‌کننده با موفقیت به‌روزرسانی شد.');
        return true;
      }

      return false;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  async deleteSupplier(supplier: Supplier): Promise<void> {
    const accepted = await this.confirmations.confirm({
      header: 'حذف تأمین‌کننده',
      message: 'آیا از حذف این تأمین‌کننده مطمئن هستید؟',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger'
    });

    if (!accepted) {
      return;
    }

    const result = await this.delete(supplier.id);

    if (result.success) {
      this.notifications.success('تأمین‌کننده با موفقیت حذف شد.');
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
