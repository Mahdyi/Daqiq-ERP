import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, RuntimeConfigService, RuntimeLookupValue, AuthorizationService } from '@daqiq/core';
import { CrudFacadeBase } from '@daqiq/shared';
import { ConfirmationService, FormFieldOption, NotificationService } from '@daqiq/ui';
import { firstValueFrom, forkJoin } from 'rxjs';

import { createProductFormFields } from '../config/product-form.config';
import { ProductRepository } from '../data-access/product-repository.service';
import type { CreateProductPostgrestRequest } from '../dto/create-product-postgrest-request.dto';
import type { UpdateProductPostgrestRequest } from '../dto/update-product-postgrest-request.dto';
import {
  mapFormValueToCreateProductRequest,
  mapFormValueToUpdateProductRequest
} from '../mappers/product-form.mapper';
import type { Product } from '../models/product.model';
import type { ProductFormValue } from '../models/product-form-value.model';
import type { ProductQuery } from '../models/product-query.model';
import type { ProductType } from '../models/product-type.model';

const DEFAULT_QUERY: ProductQuery = {
  page: 0,
  pageSize: 20,
  sortField: 'createdAt',
  sortDirection: 'desc'
};

@Injectable()
export class ProductFacade extends CrudFacadeBase<
  Product,
  string,
  CreateProductPostgrestRequest,
  UpdateProductPostgrestRequest,
  ProductQuery
> {
  protected override readonly resource = inject(ProductRepository);

  private readonly authorization = inject(AuthorizationService);
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmations = inject(ConfirmationService);
  private readonly editingProductSignal = signal<Product | null>(null);
  private readonly editorLoadingSignal = signal(false);
  private readonly editorErrorSignal = signal<ApiError | null>(null);
  private readonly submittingSignal = signal(false);
  private readonly lookupsLoadingSignal = signal(false);
  private readonly lookupValuesSignal = signal<readonly RuntimeLookupValue[]>([]);

  readonly editingProduct: Signal<Product | null> = this.editingProductSignal.asReadonly();
  readonly editorLoading: Signal<boolean> = this.editorLoadingSignal.asReadonly();
  readonly editorError: Signal<ApiError | null> = this.editorErrorSignal.asReadonly();
  readonly submitting: Signal<boolean> = this.submittingSignal.asReadonly();
  readonly lookupsLoading: Signal<boolean> = this.lookupsLoadingSignal.asReadonly();
  readonly canCreate = computed(() => this.authorization.hasPermission('products.create'));
  readonly canUpdate = computed(() => this.authorization.hasPermission('products.update'));
  readonly canDelete = computed(() => this.authorization.hasPermission('products.delete'));
  readonly canView = computed(() => this.authorization.hasPermission('products.view'));

  readonly categoryOptions = computed(() => this.optionsForType('product_category'));
  readonly unitOptions = computed(() => this.optionsForType('unit'));
  readonly taxRateOptions = computed(() => this.optionsForType('tax_rate'));
  readonly formFields = computed(() =>
    createProductFormFields({
      categoryOptions: this.categoryOptions(),
      unitOptions: this.unitOptions(),
      taxRateOptions: this.taxRateOptions()
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
      const [categories, units, taxRates] = await firstValueFrom(
        forkJoin([
          this.runtimeConfig.getLookupValues('product_category'),
          this.runtimeConfig.getLookupValues('unit'),
          this.runtimeConfig.getLookupValues('tax_rate')
        ])
      );
      this.lookupValuesSignal.set([...categories, ...units, ...taxRates]);
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

  async filterProductType(productType: ProductType | null): Promise<void> {
    await this.load({
      ...(this.query() ?? DEFAULT_QUERY),
      page: 0,
      productType: productType ?? undefined
    });
  }

  async paginate(page: number, pageSize: number): Promise<void> {
    await this.load({
      ...(this.query() ?? DEFAULT_QUERY),
      page,
      pageSize
    });
  }

  async sort(sortField: keyof Product | null, sortDirection: 'asc' | 'desc' | null): Promise<void> {
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
      this.editingProductSignal.set(await firstValueFrom(this.resource.getById(id)));
    } catch (error: unknown) {
      this.editorErrorSignal.set(this.toApiError(error));
      this.editingProductSignal.set(null);
    } finally {
      this.editorLoadingSignal.set(false);
    }
  }

  async createProduct(value: Readonly<ProductFormValue>): Promise<boolean> {
    this.submittingSignal.set(true);

    try {
      const result = await this.create(mapFormValueToCreateProductRequest(value));

      if (result.success) {
        this.notifications.success('کالا با موفقیت ایجاد شد.');
        return true;
      }

      return false;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  async updateProduct(id: string, value: Readonly<ProductFormValue>): Promise<boolean> {
    this.submittingSignal.set(true);

    try {
      const result = await this.update(id, mapFormValueToUpdateProductRequest(value));

      if (result.success) {
        this.notifications.success('اطلاعات کالا با موفقیت به‌روزرسانی شد.');
        return true;
      }

      return false;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  async deleteProduct(product: Product): Promise<void> {
    const accepted = await this.confirmations.confirm({
      header: 'حذف کالا',
      message: 'آیا از حذف این کالا مطمئن هستید؟',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger'
    });

    if (!accepted) {
      return;
    }

    const result = await this.delete(product.id);

    if (result.success) {
      this.notifications.success('کالا با موفقیت حذف شد.');
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
