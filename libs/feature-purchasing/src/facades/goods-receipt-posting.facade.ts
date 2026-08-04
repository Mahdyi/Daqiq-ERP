import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiError, AuthorizationService } from '@daqiq/core';
import { NotificationService } from '@daqiq/ui';
import { firstValueFrom, forkJoin } from 'rxjs';

import { GoodsReceiptCommandService } from '../data-access/goods-receipt-command.service';
import { GoodsReceiptRepository } from '../data-access/goods-receipt-repository.service';
import { PurchaseOrderReferenceDataService } from '../data-access/purchase-order-reference-data.service';
import { PurchaseOrderRepository } from '../data-access/purchase-order-repository.service';
import { mapPostingFormToRequest } from '../mappers/goods-receipt-posting.mapper';
import type {
  GoodsReceiptPostingLineValue
} from '../models/goods-receipt-posting-form.model';
import type { GoodsReceipt } from '../models/goods-receipt.model';
import type { PurchaseOrderOption } from '../models/purchase-order-option.model';
import type { PurchaseOrderLineReceivingProgress } from '../models/purchase-order-receiving-progress.model';
import type { PurchaseOrder } from '../models/purchase-order.model';
import { toApiError } from './purchase-order.facade';

@Injectable()
export class GoodsReceiptPostingFacade {
  private readonly purchaseOrders = inject(PurchaseOrderRepository);
  private readonly goodsReceipts = inject(GoodsReceiptRepository);
  private readonly commands = inject(GoodsReceiptCommandService);
  private readonly referenceData = inject(PurchaseOrderReferenceDataService);
  private readonly authorization = inject(AuthorizationService);
  private readonly notifications = inject(NotificationService);
  private readonly orderSignal = signal<PurchaseOrder | null>(null);
  private readonly progressSignal = signal<readonly PurchaseOrderLineReceivingProgress[]>([]);
  private readonly warehousesSignal = signal<readonly PurchaseOrderOption[]>([]);
  private readonly locationsSignal = signal<readonly PurchaseOrderOption[]>([]);
  private readonly warehouseIdSignal = signal<string | null>(null);
  private readonly receiptDateSignal = signal(toDateInputValue(new Date()));
  private readonly notesSignal = signal<string | null>(null);
  private readonly linesSignal = signal<readonly GoodsReceiptPostingLineValue[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly postingSignal = signal(false);
  private readonly errorSignal = signal<ApiError | null>(null);

  readonly order: Signal<PurchaseOrder | null> = this.orderSignal.asReadonly();
  readonly progress = this.progressSignal.asReadonly();
  readonly warehouses = this.warehousesSignal.asReadonly();
  readonly locations = this.locationsSignal.asReadonly();
  readonly warehouseId = this.warehouseIdSignal.asReadonly();
  readonly receiptDate = this.receiptDateSignal.asReadonly();
  readonly notes = this.notesSignal.asReadonly();
  readonly lines = this.linesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly posting = this.postingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly canPost = computed(() => this.authorization.hasPermission('receiving.post'));
  readonly hasRemainingQuantity = computed(() =>
    this.progress().some((line) => line.remainingQuantity > 0)
  );
  readonly canSubmit = computed(() =>
    this.canPost() &&
    this.hasRemainingQuantity() &&
    this.warehouseId() !== null &&
    this.lines().some((line) => (line.receivedQuantity ?? 0) > 0) &&
    !this.posting()
  );

  async initialize(purchaseOrderId: string): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const [order, progress, warehouses] = await firstValueFrom(
        forkJoin([
          this.purchaseOrders.getById(purchaseOrderId),
          this.goodsReceipts.listPurchaseOrderReceivingProgress(purchaseOrderId),
          this.referenceData.listWarehouses()
        ])
      );
      const initialWarehouseId = order.deliveryWarehouseId ?? warehouses[0]?.id ?? null;
      this.orderSignal.set(order);
      this.progressSignal.set(progress);
      this.warehousesSignal.set(warehouses);
      this.warehouseIdSignal.set(initialWarehouseId);
      this.linesSignal.set(createInitialLines(progress));

      if (initialWarehouseId) {
        await this.loadLocations(initialWarehouseId);
      }
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
      this.orderSignal.set(null);
      this.progressSignal.set([]);
      this.linesSignal.set([]);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async setWarehouseId(warehouseId: string | null): Promise<void> {
    this.warehouseIdSignal.set(warehouseId);
    this.linesSignal.update((lines) =>
      lines.map((line) => ({
        ...line,
        storageLocationId: null
      }))
    );

    if (warehouseId) {
      await this.loadLocations(warehouseId);
    } else {
      this.locationsSignal.set([]);
    }
  }

  setReceiptDate(value: string): void {
    this.receiptDateSignal.set(value);
  }

  setNotes(value: string | null): void {
    this.notesSignal.set(value);
  }

  updateLineQuantity(purchaseOrderLineId: string, quantity: number | null): void {
    this.linesSignal.update((lines) =>
      lines.map((line) =>
        line.purchaseOrderLineId === purchaseOrderLineId
          ? { ...line, receivedQuantity: quantity }
          : line
      )
    );
  }

  updateLineLocation(purchaseOrderLineId: string, storageLocationId: string | null): void {
    this.linesSignal.update((lines) =>
      lines.map((line) =>
        line.purchaseOrderLineId === purchaseOrderLineId
          ? { ...line, storageLocationId }
          : line
      )
    );
  }

  updateLineNotes(purchaseOrderLineId: string, notes: string | null): void {
    this.linesSignal.update((lines) =>
      lines.map((line) =>
        line.purchaseOrderLineId === purchaseOrderLineId ? { ...line, notes } : line
      )
    );
  }

  lineValue(purchaseOrderLineId: string): GoodsReceiptPostingLineValue | null {
    return this.lines().find((line) => line.purchaseOrderLineId === purchaseOrderLineId) ?? null;
  }

  async post(): Promise<GoodsReceipt | null> {
    const order = this.order();

    if (!order) {
      return null;
    }

    this.postingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const receipt = await firstValueFrom(
        this.commands.postReceipt(
          mapPostingFormToRequest(order.id, {
            receiptDate: this.receiptDate(),
            warehouseId: this.warehouseId(),
            notes: this.notes(),
            lines: this.lines()
          })
        )
      );
      this.notifications.success('رسید خرید با موفقیت ثبت و موجودی انبار به‌روزرسانی شد.');
      return receipt;
    } catch (error: unknown) {
      this.errorSignal.set(toApiError(error));
      return null;
    } finally {
      this.postingSignal.set(false);
    }
  }

  private async loadLocations(warehouseId: string): Promise<void> {
    const locations = await firstValueFrom(this.referenceData.listStorageLocations(warehouseId));
    this.locationsSignal.set(locations);
  }
}

function createInitialLines(
  progress: readonly PurchaseOrderLineReceivingProgress[]
): readonly GoodsReceiptPostingLineValue[] {
  return progress.map((line) => ({
    purchaseOrderLineId: line.purchaseOrderLineId,
    receivedQuantity: line.remainingQuantity > 0 ? line.remainingQuantity : null,
    storageLocationId: null,
    notes: null
  }));
}

function toDateInputValue(value: Date): string {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0')
  ].join('-');
}
