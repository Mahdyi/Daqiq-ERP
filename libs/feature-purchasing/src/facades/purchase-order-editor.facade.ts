import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import {
  ApiError,
  RuntimeConfigService,
  RuntimeLookupValue
} from '@daqiq/core';
import { FormFieldOption, NotificationService } from '@daqiq/ui';
import { firstValueFrom, forkJoin } from 'rxjs';

import { createPurchaseOrderHeaderFormFields } from '../config/purchase-order-header-form.config';
import { PurchaseOrderCommandService } from '../data-access/purchase-order-command.service';
import { PurchaseOrderReferenceDataService } from '../data-access/purchase-order-reference-data.service';
import { PurchaseOrderRepository } from '../data-access/purchase-order-repository.service';
import {
  DEFAULT_PURCHASE_ORDER_FORM_VALUE,
  mapFormToCreatePurchaseOrderRequest,
  mapFormToUpdatePurchaseOrderRequest,
  mapLineToFormValue,
  mapPurchaseOrderToFormValue
} from '../mappers/purchase-order-form.mapper';
import type {
  PurchaseOrderFormValue,
  PurchaseOrderLineFormValue
} from '../models/purchase-order-form-value.model';
import type {
  PurchaseOrderOption,
  PurchaseOrderProductOption
} from '../models/purchase-order-option.model';
import type { PurchaseOrder } from '../models/purchase-order.model';
import { toApiError } from './purchase-order.facade';

@Injectable()
export class PurchaseOrderEditorFacade {
  private readonly repository = inject(PurchaseOrderRepository);
  private readonly commands = inject(PurchaseOrderCommandService);
  private readonly referenceData = inject(PurchaseOrderReferenceDataService);
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly notifications = inject(NotificationService);
  private readonly orderSignal = signal<PurchaseOrder | null>(null);
  private readonly linesSignal = signal<readonly PurchaseOrderLineFormValue[]>([]);
  private readonly suppliersSignal = signal<readonly PurchaseOrderOption[]>([]);
  private readonly productsSignal = signal<readonly PurchaseOrderProductOption[]>([]);
  private readonly warehousesSignal = signal<readonly PurchaseOrderOption[]>([]);
  private readonly lookupValuesSignal = signal<readonly RuntimeLookupValue[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly submittingSignal = signal(false);
  private readonly errorSignal = signal<ApiError | null>(null);

  readonly order: Signal<PurchaseOrder | null> = this.orderSignal.asReadonly();
  readonly lines = this.linesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly submitting = this.submittingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly initialValue = computed(() =>
    this.order() ? mapPurchaseOrderToFormValue(this.order() as PurchaseOrder) : DEFAULT_PURCHASE_ORDER_FORM_VALUE
  );
  readonly supplierOptions = computed(() => toFormOptions(this.suppliersSignal()));
  readonly productOptions = computed(() => toFormOptions(this.productsSignal()));
  readonly currencyOptions = computed(() => this.optionsForLookupType('currency'));
  readonly warehouseOptions = computed(() => toFormOptions(this.warehousesSignal()));
  readonly taxRateOptions = computed(() => this.optionsForLookupType('tax_rate'));
  readonly fields = computed(() =>
    createPurchaseOrderHeaderFormFields({
      supplierOptions: this.supplierOptions(),
      currencyOptions: this.currencyOptions(),
      warehouseOptions: this.warehouseOptions()
    })
  );
  readonly subtotal = computed(() =>
    this.lines().reduce((sum, line) => sum + calculateLineSubtotal(line), 0)
  );
  readonly taxTotal = computed(() =>
    this.lines().reduce((sum, line) => sum + calculateLineTax(line, this.lookupValuesSignal()), 0)
  );
  readonly total = computed(() => this.subtotal() + this.taxTotal());

  async initialize(orderId: string | null): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await this.loadReferenceData();

      if (orderId) {
        const [order, lines] = await Promise.all([
          firstValueFrom(this.repository.getById(orderId)),
          firstValueFrom(this.repository.listLines(orderId))
        ]);
        this.orderSignal.set(order);
        this.linesSignal.set(lines.map(mapLineToFormValue));
      }
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
    } finally {
      this.loadingSignal.set(false);
    }
  }

  addLine(line: Readonly<PurchaseOrderLineFormValue>): void {
    this.linesSignal.update((lines) => [
      ...lines,
      {
        ...line,
        clientId: createClientId()
      }
    ]);
  }

  removeLine(clientId: string): void {
    this.linesSignal.update((lines) => lines.filter((line) => line.clientId !== clientId));
  }

  productById(id: string | null): PurchaseOrderProductOption | null {
    if (!id) {
      return null;
    }

    return this.productsSignal().find((product) => product.id === id) ?? null;
  }

  lookupLabel(id: string | null): string {
    if (!id) {
      return '—';
    }

    return this.lookupValuesSignal().find((value) => value.id === id)?.label ?? id;
  }

  productLabel(id: string | null): string {
    if (!id) {
      return '—';
    }

    return this.productsSignal().find((product) => product.id === id)?.label ?? id;
  }

  async create(value: Readonly<PurchaseOrderFormValue>): Promise<PurchaseOrder | null> {
    this.submittingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const order = await firstValueFrom(
        this.commands.create(mapFormToCreatePurchaseOrderRequest(value, this.lines()))
      );
      this.notifications.success('سفارش خرید با موفقیت ایجاد شد.');
      return order;
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
      return null;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  async update(
    orderId: string,
    value: Readonly<PurchaseOrderFormValue>
  ): Promise<PurchaseOrder | null> {
    this.submittingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const order = await firstValueFrom(
        this.commands.update(mapFormToUpdatePurchaseOrderRequest(orderId, value, this.lines()))
      );
      this.notifications.success('اطلاعات سفارش خرید با موفقیت به‌روزرسانی شد.');
      return order;
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
      return null;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  private async loadReferenceData(): Promise<void> {
    const [suppliers, products, warehouses, currencies, taxRates, units] = await firstValueFrom(
      forkJoin([
        this.referenceData.listSuppliers(),
        this.referenceData.listProducts(),
        this.referenceData.listWarehouses(),
        this.runtimeConfig.getLookupValues('currency'),
        this.runtimeConfig.getLookupValues('tax_rate'),
        this.runtimeConfig.getLookupValues('unit')
      ])
    );
    this.suppliersSignal.set(suppliers);
    this.productsSignal.set(
      products.map((product) => ({
        ...product,
        baseUnitLabel: units.find((unit) => unit.id === product.baseUnitLookupValueId)?.label ?? ''
      }))
    );
    this.warehousesSignal.set(warehouses);
    this.lookupValuesSignal.set([...currencies, ...taxRates, ...units]);
  }

  private optionsForLookupType(typeCode: string): readonly FormFieldOption[] {
    return this.lookupValuesSignal()
      .filter((value) => value.lookupTypeCode === typeCode && value.active)
      .map((value) => ({
        label: value.label,
        value: value.id
      }));
  }
}

export function calculateLineSubtotal(line: Readonly<PurchaseOrderLineFormValue>): number {
  return Math.max(0, line.quantity ?? 0) * Math.max(0, line.unitPrice ?? 0);
}

export function calculateLineTax(
  line: Readonly<PurchaseOrderLineFormValue>,
  lookups: readonly RuntimeLookupValue[]
): number {
  const taxCode = lookups.find((value) => value.id === line.taxRateLookupValueId)?.code;
  const rate = taxCode === 'standard' ? 0.1 : taxCode === 'reduced' ? 0.05 : 0;

  return Math.round(calculateLineSubtotal(line) * rate * 100) / 100;
}

function toFormOptions(options: readonly PurchaseOrderOption[]): readonly FormFieldOption[] {
  return options.map((option) => ({
    label: option.label,
    value: option.id
  }));
}

function createClientId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
