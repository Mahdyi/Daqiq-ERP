import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import {
  ApiError,
  RuntimeConfigService,
  RuntimeLookupValue
} from '@daqiq/core';
import { FormFieldOption, NotificationService } from '@daqiq/ui';
import { firstValueFrom, forkJoin } from 'rxjs';

import { createSalesOrderHeaderFormFields } from '../config/sales-order-header-form.config';
import { SalesOrderCommandService } from '../data-access/sales-order-command.service';
import { SalesOrderReferenceDataService } from '../data-access/sales-order-reference-data.service';
import { SalesOrderRepository } from '../data-access/sales-order-repository.service';
import {
  DEFAULT_SALES_ORDER_FORM_VALUE,
  mapFormToCreateSalesOrderRequest,
  mapFormToUpdateSalesOrderRequest,
  mapLineToFormValue,
  mapSalesOrderToFormValue
} from '../mappers/sales-order-form.mapper';
import type {
  SalesOrderFormValue,
  SalesOrderLineFormValue
} from '../models/sales-order-form-value.model';
import type {
  SalesOrderOption,
  SalesOrderProductOption
} from '../models/sales-order-option.model';
import type { SalesOrder } from '../models/sales-order.model';
import { toApiError } from './sales-order.facade';

@Injectable()
export class SalesOrderEditorFacade {
  private readonly repository = inject(SalesOrderRepository);
  private readonly commands = inject(SalesOrderCommandService);
  private readonly referenceData = inject(SalesOrderReferenceDataService);
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly notifications = inject(NotificationService);
  private readonly orderSignal = signal<SalesOrder | null>(null);
  private readonly linesSignal = signal<readonly SalesOrderLineFormValue[]>([]);
  private readonly customersSignal = signal<readonly SalesOrderOption[]>([]);
  private readonly productsSignal = signal<readonly SalesOrderProductOption[]>([]);
  private readonly warehousesSignal = signal<readonly SalesOrderOption[]>([]);
  private readonly lookupValuesSignal = signal<readonly RuntimeLookupValue[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly submittingSignal = signal(false);
  private readonly errorSignal = signal<ApiError | null>(null);

  readonly order: Signal<SalesOrder | null> = this.orderSignal.asReadonly();
  readonly lines = this.linesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly submitting = this.submittingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly initialValue = computed(() =>
    this.order() ? mapSalesOrderToFormValue(this.order() as SalesOrder) : DEFAULT_SALES_ORDER_FORM_VALUE
  );
  readonly customerOptions = computed(() => toFormOptions(this.customersSignal()));
  readonly productOptions = computed(() => toFormOptions(this.productsSignal()));
  readonly currencyOptions = computed(() => this.optionsForLookupType('currency'));
  readonly warehouseOptions = computed(() => toFormOptions(this.warehousesSignal()));
  readonly taxRateOptions = computed(() => this.optionsForLookupType('tax_rate'));
  readonly fields = computed(() =>
    createSalesOrderHeaderFormFields({
      customerOptions: this.customerOptions(),
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

  addLine(line: Readonly<SalesOrderLineFormValue>): void {
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

  productById(id: string | null): SalesOrderProductOption | null {
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

  async create(value: Readonly<SalesOrderFormValue>): Promise<SalesOrder | null> {
    this.submittingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const order = await firstValueFrom(
        this.commands.create(mapFormToCreateSalesOrderRequest(value, this.lines()))
      );
      this.notifications.success('سفارش فروش با موفقیت ایجاد شد.');
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
    value: Readonly<SalesOrderFormValue>
  ): Promise<SalesOrder | null> {
    this.submittingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const order = await firstValueFrom(
        this.commands.update(mapFormToUpdateSalesOrderRequest(orderId, value, this.lines()))
      );
      this.notifications.success('اطلاعات سفارش فروش با موفقیت به‌روزرسانی شد.');
      return order;
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
      return null;
    } finally {
      this.submittingSignal.set(false);
    }
  }

  private async loadReferenceData(): Promise<void> {
    const [customers, products, warehouses, currencies, taxRates, units] = await firstValueFrom(
      forkJoin([
        this.referenceData.listCustomers(),
        this.referenceData.listProducts(),
        this.referenceData.listWarehouses(),
        this.runtimeConfig.getLookupValues('currency'),
        this.runtimeConfig.getLookupValues('tax_rate'),
        this.runtimeConfig.getLookupValues('unit')
      ])
    );
    this.customersSignal.set(customers);
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

export function calculateLineSubtotal(line: Readonly<SalesOrderLineFormValue>): number {
  return Math.max(0, line.quantity ?? 0) * Math.max(0, line.unitPrice ?? 0);
}

export function calculateLineTax(
  line: Readonly<SalesOrderLineFormValue>,
  lookups: readonly RuntimeLookupValue[]
): number {
  const taxCode = lookups.find((value) => value.id === line.taxRateLookupValueId)?.code;
  const rate = taxCode === 'standard' ? 0.1 : taxCode === 'reduced' ? 0.05 : 0;

  return Math.round(calculateLineSubtotal(line) * rate * 100) / 100;
}

function toFormOptions(options: readonly SalesOrderOption[]): readonly FormFieldOption[] {
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

