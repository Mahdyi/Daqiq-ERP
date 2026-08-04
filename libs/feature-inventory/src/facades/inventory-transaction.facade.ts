import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, AuthorizationService } from '@daqiq/core';
import { FormFieldOption, NotificationService } from '@daqiq/ui';
import { firstValueFrom, forkJoin } from 'rxjs';

import { createInventoryAdjustmentFormFields } from '../config/inventory-adjustment-form.config';
import { createInventoryTransferFormFields } from '../config/inventory-transfer-form.config';
import { InventoryReferenceDataService } from '../data-access/inventory-reference-data.service';
import { InventoryTransactionService } from '../data-access/inventory-transaction.service';
import {
  mapAdjustmentToInRequest,
  mapAdjustmentToOutRequest,
  mapTransferToRequest,
  transferSourceMatchesDestination
} from '../mappers/inventory-transaction.mapper';
import type {
  InventoryAdjustmentFormValue,
  InventoryOption,
  InventoryTransferFormValue
} from '../models/inventory-transaction-form-value.model';

@Injectable()
export class InventoryTransactionFacade {
  private readonly transactions = inject(InventoryTransactionService);
  private readonly referenceData = inject(InventoryReferenceDataService);
  private readonly notifications = inject(NotificationService);
  private readonly authorization = inject(AuthorizationService);
  private readonly productsSignal = signal<readonly InventoryOption[]>([]);
  private readonly warehousesSignal = signal<readonly InventoryOption[]>([]);
  private readonly locationsSignal = signal<readonly InventoryOption[]>([]);
  private readonly referenceLoadingSignal = signal(false);
  private readonly submittingSignal = signal(false);
  private readonly errorSignal = signal<ApiError | null>(null);

  readonly products: Signal<readonly InventoryOption[]> = this.productsSignal.asReadonly();
  readonly warehouses: Signal<readonly InventoryOption[]> = this.warehousesSignal.asReadonly();
  readonly storageLocations: Signal<readonly InventoryOption[]> = this.locationsSignal.asReadonly();
  readonly referenceLoading: Signal<boolean> = this.referenceLoadingSignal.asReadonly();
  readonly submitting: Signal<boolean> = this.submittingSignal.asReadonly();
  readonly error: Signal<ApiError | null> = this.errorSignal.asReadonly();
  readonly canAdjust = computed(() => this.authorization.hasPermission('inventory.adjust'));
  readonly canTransfer = computed(() => this.authorization.hasPermission('inventory.transfer'));

  readonly productOptions = computed(() => toFieldOptions(this.products()));
  readonly warehouseOptions = computed(() => toFieldOptions(this.warehouses()));
  readonly storageLocationOptions = computed(() => toFieldOptions(this.storageLocations()));
  readonly adjustmentFields = computed(() =>
    createInventoryAdjustmentFormFields({
      productOptions: this.productOptions(),
      warehouseOptions: this.warehouseOptions(),
      storageLocationOptions: this.storageLocationOptions()
    })
  );
  readonly transferFields = computed(() =>
    createInventoryTransferFormFields({
      productOptions: this.productOptions(),
      warehouseOptions: this.warehouseOptions(),
      storageLocationOptions: this.storageLocationOptions()
    })
  );

  async loadReferenceData(): Promise<void> {
    this.referenceLoadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const [products, warehouses, storageLocations] = await firstValueFrom(
        forkJoin([
          this.referenceData.products(),
          this.referenceData.warehouses(),
          this.referenceData.storageLocations()
        ])
      );

      this.productsSignal.set(products);
      this.warehousesSignal.set(warehouses);
      this.locationsSignal.set(storageLocations);
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
    } finally {
      this.referenceLoadingSignal.set(false);
    }
  }

  async submitAdjustment(value: Readonly<InventoryAdjustmentFormValue>): Promise<boolean> {
    this.submittingSignal.set(true);
    this.errorSignal.set(null);

    try {
      if (value.movementDirection === 'out') {
        await firstValueFrom(this.transactions.adjustOut(mapAdjustmentToOutRequest(value)));
        this.notifications.success('کاهش موجودی با موفقیت ثبت شد.');
        return true;
      }

      await firstValueFrom(this.transactions.adjustIn(mapAdjustmentToInRequest(value)));
      this.notifications.success('افزایش موجودی با موفقیت ثبت شد.');
      return true;
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
      return false;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  async submitTransfer(value: Readonly<InventoryTransferFormValue>): Promise<boolean> {
    this.submittingSignal.set(true);
    this.errorSignal.set(null);

    try {
      if (transferSourceMatchesDestination(value)) {
        this.errorSignal.set(
          new ApiError({
            status: 400,
            code: 'VALIDATION',
            message: 'مبدا و مقصد انتقال نمی‌توانند یکسان باشند.',
            fieldErrors: []
          })
        );
        return false;
      }

      await firstValueFrom(this.transactions.transfer(mapTransferToRequest(value)));
      this.notifications.success('انتقال موجودی با موفقیت ثبت شد.');
      return true;
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
      return false;
    } finally {
      this.submittingSignal.set(false);
    }
  }
}

function toFieldOptions(options: readonly InventoryOption[]): readonly FormFieldOption[] {
  return options.map((option) => ({
    label: option.label,
    value: option.id
  }));
}

function toApiError(error: unknown): ApiError {
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
