import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiError } from '@daqiq/core';
import { NotificationService } from '@daqiq/ui';
import { firstValueFrom } from 'rxjs';

import { SalesDeliveryCommandService } from '../data-access/sales-delivery-command.service';
import { SalesDeliveryRepository } from '../data-access/sales-delivery-repository.service';
import { SalesOrderReferenceDataService } from '../data-access/sales-order-reference-data.service';
import { SalesOrderRepository } from '../data-access/sales-order-repository.service';
import type { SalesOrderLineDeliveryProgress } from '../models/sales-order-line-delivery-progress.model';
import type { SalesOrderOption } from '../models/sales-order-option.model';
import type { SalesDeliveryPostingLine } from '../models/sales-delivery-posting.model';
import type { SalesOrder } from '../models/sales-order.model';
import { toApiError } from './sales-order.facade';

interface PostingLineDraft {
  readonly salesOrderLineId: string;
  readonly shippedQuantity: number;
  readonly storageLocationId: string | null;
  readonly notes: string | null;
}

@Injectable()
export class SalesDeliveryPostingFacade {
  private readonly salesOrders = inject(SalesOrderRepository);
  private readonly deliveries = inject(SalesDeliveryRepository);
  private readonly commands = inject(SalesDeliveryCommandService);
  private readonly references = inject(SalesOrderReferenceDataService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  private readonly orderSignal = signal<SalesOrder | null>(null);
  private readonly progressSignal = signal<readonly SalesOrderLineDeliveryProgress[]>([]);
  private readonly warehousesSignal = signal<readonly SalesOrderOption[]>([]);
  private readonly locationsSignal = signal<readonly SalesOrderOption[]>([]);
  private readonly draftLinesSignal = signal<readonly PostingLineDraft[]>([]);
  private readonly warehouseIdSignal = signal<string | null>(null);
  private readonly deliveryDateSignal = signal(toDateInputValue(new Date()));
  private readonly notesSignal = signal<string | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly submittingSignal = signal(false);
  private readonly errorSignal = signal<ApiError | null>(null);

  readonly order = this.orderSignal.asReadonly();
  readonly progress = this.progressSignal.asReadonly();
  readonly warehouses = this.warehousesSignal.asReadonly();
  readonly locations = this.locationsSignal.asReadonly();
  readonly draftLines = this.draftLinesSignal.asReadonly();
  readonly warehouseId = this.warehouseIdSignal.asReadonly();
  readonly deliveryDate = this.deliveryDateSignal.asReadonly();
  readonly notes = this.notesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly submitting = this.submittingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly canSubmit = computed(() =>
    Boolean(this.warehouseId()) &&
    this.draftLines().some((line) => line.shippedQuantity > 0) &&
    this.draftLines().every((line) => this.quantityIsValid(line))
  );

  async load(salesOrderId: string): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const [order, progress, warehouses] = await Promise.all([
        firstValueFrom(this.salesOrders.getById(salesOrderId)),
        firstValueFrom(this.deliveries.listSalesOrderProgress(salesOrderId)),
        firstValueFrom(this.references.listWarehouses())
      ]);

      this.orderSignal.set(order);
      this.progressSignal.set(progress);
      this.warehousesSignal.set(warehouses);
      this.warehouseIdSignal.set(order.deliveryWarehouseId);
      this.draftLinesSignal.set(
        progress
          .filter((line) => line.remainingQuantity > 0)
          .map((line) => ({
            salesOrderLineId: line.salesOrderLineId,
            shippedQuantity: line.remainingQuantity,
            storageLocationId: null,
            notes: null
          }))
      );

      if (order.deliveryWarehouseId) {
        await this.loadLocations(order.deliveryWarehouseId);
      }
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async changeWarehouse(warehouseId: string): Promise<void> {
    this.warehouseIdSignal.set(warehouseId || null);
    this.draftLinesSignal.update((lines) =>
      lines.map((line) => ({ ...line, storageLocationId: null }))
    );
    await this.loadLocations(warehouseId);
  }

  setDeliveryDate(value: string): void {
    this.deliveryDateSignal.set(value);
  }

  setNotes(value: string): void {
    this.notesSignal.set(value.trim() || null);
  }

  updateLineQuantity(salesOrderLineId: string, value: number): void {
    this.draftLinesSignal.update((lines) =>
      lines.map((line) =>
        line.salesOrderLineId === salesOrderLineId
          ? { ...line, shippedQuantity: Math.max(0, value) }
          : line
      )
    );
  }

  updateLineLocation(salesOrderLineId: string, value: string): void {
    this.draftLinesSignal.update((lines) =>
      lines.map((line) =>
        line.salesOrderLineId === salesOrderLineId
          ? { ...line, storageLocationId: value || null }
          : line
      )
    );
  }

  updateLineNotes(salesOrderLineId: string, value: string): void {
    this.draftLinesSignal.update((lines) =>
      lines.map((line) =>
        line.salesOrderLineId === salesOrderLineId ? { ...line, notes: value.trim() || null } : line
      )
    );
  }

  async submit(): Promise<void> {
    const order = this.order();
    const warehouseId = this.warehouseId();

    if (!order || !warehouseId || !this.canSubmit()) {
      return;
    }

    this.submittingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const result = await firstValueFrom(
        this.commands.post({
          salesOrderId: order.id,
          deliveryDate: this.deliveryDate(),
          warehouseId,
          notes: this.notes(),
          lines: this.draftLines()
            .filter((line) => line.shippedQuantity > 0)
            .map((line): SalesDeliveryPostingLine => ({
              salesOrderLineId: line.salesOrderLineId,
              shippedQuantity: line.shippedQuantity,
              storageLocationId: line.storageLocationId,
              notes: line.notes
            }))
        })
      );

      this.notifications.success('حواله فروش با موفقیت ثبت شد.');
      void this.router.navigate(['/sales/sales-deliveries', result.delivery.id]);
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
    } finally {
      this.submittingSignal.set(false);
    }
  }

  lineDraft(salesOrderLineId: string): PostingLineDraft | null {
    return this.draftLines().find((line) => line.salesOrderLineId === salesOrderLineId) ?? null;
  }

  quantityIsValid(line: PostingLineDraft): boolean {
    const progress = this.progress().find((item) => item.salesOrderLineId === line.salesOrderLineId);

    if (!progress) {
      return false;
    }

    return line.shippedQuantity >= 0 && line.shippedQuantity <= progress.remainingQuantity;
  }

  private async loadLocations(warehouseId: string | null): Promise<void> {
    if (!warehouseId) {
      this.locationsSignal.set([]);
      return;
    }

    try {
      const locations = await firstValueFrom(this.references.listStorageLocations(warehouseId));
      this.locationsSignal.set(locations);
    } catch {
      this.locationsSignal.set([]);
    }
  }
}

function toDateInputValue(value: Date): string {
  return value.toISOString().slice(0, 10);
}
