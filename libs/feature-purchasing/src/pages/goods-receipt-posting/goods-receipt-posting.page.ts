import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent, CardComponent, PageContainerComponent } from '@daqiq/ui';

import { formatNumber } from '../../config/purchase-order-table.config';
import { GoodsReceiptPostingFacade } from '../../facades/goods-receipt-posting.facade';
import type { PurchaseOrderLineReceivingProgress } from '../../models/purchase-order-receiving-progress.model';

@Component({
  selector: 'daqiq-goods-receipt-posting-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    ButtonComponent
  ],
  templateUrl: './goods-receipt-posting.page.html',
  styleUrl: './goods-receipt-posting.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoodsReceiptPostingPage implements OnInit {
  protected readonly facade = inject(GoodsReceiptPostingFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly purchaseOrderId = this.route.snapshot.paramMap.get('id');
  protected readonly title = computed(() =>
    this.facade.order()?.orderNumber
      ? `ثبت رسید برای سفارش ${this.facade.order()?.orderNumber}`
      : 'ثبت رسید خرید'
  );

  ngOnInit(): void {
    if (this.purchaseOrderId) {
      void this.facade.initialize(this.purchaseOrderId);
    }
  }

  protected handleBack(): void {
    if (this.purchaseOrderId) {
      void this.router.navigate(['/purchasing/purchase-orders', this.purchaseOrderId]);
      return;
    }

    void this.router.navigate(['/purchasing/purchase-orders']);
  }

  protected handleReceiptDateInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.facade.setReceiptDate(target.value);
    }
  }

  protected handleWarehouseChange(event: Event): void {
    const value = this.readSelectValue(event);
    void this.facade.setWarehouseId(value);
  }

  protected handleNotesInput(event: Event): void {
    const value = this.readTextValue(event);
    this.facade.setNotes(value);
  }

  protected handleLineQuantityInput(
    progress: PurchaseOrderLineReceivingProgress,
    event: Event
  ): void {
    const quantity = this.readNumericValue(event);
    const boundedQuantity = quantity === null
      ? null
      : Math.min(Math.max(quantity, 0), progress.remainingQuantity);
    this.facade.updateLineQuantity(progress.purchaseOrderLineId, boundedQuantity);
  }

  protected handleLineLocationChange(
    progress: PurchaseOrderLineReceivingProgress,
    event: Event
  ): void {
    this.facade.updateLineLocation(progress.purchaseOrderLineId, this.readSelectValue(event));
  }

  protected handleLineNotesInput(
    progress: PurchaseOrderLineReceivingProgress,
    event: Event
  ): void {
    this.facade.updateLineNotes(progress.purchaseOrderLineId, this.readTextValue(event));
  }

  protected async handlePost(): Promise<void> {
    const receipt = await this.facade.post();

    if (receipt) {
      await this.router.navigate(['/purchasing/goods-receipts', receipt.id]);
    }
  }

  protected lineQuantity(id: string): number | null {
    return this.facade.lineValue(id)?.receivedQuantity ?? null;
  }

  protected lineLocation(id: string): string | null {
    return this.facade.lineValue(id)?.storageLocationId ?? null;
  }

  protected lineNotes(id: string): string | null {
    return this.facade.lineValue(id)?.notes ?? null;
  }

  protected formatNumber(value: number): string {
    return formatNumber(value);
  }

  private readSelectValue(event: Event): string | null {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      return target.value.trim() || null;
    }

    return null;
  }

  private readTextValue(event: Event): string | null {
    const target = event.target;

    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      const value = target.value.trim();
      return value.length > 0 ? value : null;
    }

    return null;
  }

  private readNumericValue(event: Event): number | null {
    const value = this.readTextValue(event);

    if (value === null) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
