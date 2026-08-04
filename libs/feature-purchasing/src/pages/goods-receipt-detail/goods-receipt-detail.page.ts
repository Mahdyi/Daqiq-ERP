import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  DataTableComponent,
  EmptyStateComponent,
  PageContainerComponent
} from '@daqiq/ui';

import {
  createGoodsReceiptLineTableColumns
} from '../../config/goods-receipt-table.config';
import { formatDate } from '../../config/purchase-order-table.config';
import { GoodsReceiptFacade } from '../../facades/goods-receipt.facade';
import type { GoodsReceipt } from '../../models/goods-receipt.model';

@Component({
  selector: 'daqiq-goods-receipt-detail-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './goods-receipt-detail.page.html',
  styleUrl: './goods-receipt-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoodsReceiptDetailPage implements OnInit {
  protected readonly facade = inject(GoodsReceiptFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly receiptId = this.route.snapshot.paramMap.get('id');
  protected readonly lineColumns = createGoodsReceiptLineTableColumns();
  protected readonly title = computed(() =>
    this.facade.selectedReceipt()?.receiptNumber
      ? `رسید خرید ${this.facade.selectedReceipt()?.receiptNumber}`
      : 'جزئیات رسید خرید'
  );

  ngOnInit(): void {
    if (this.receiptId) {
      void this.facade.loadDetail(this.receiptId);
    }
  }

  protected handleBack(): void {
    void this.router.navigate(['/purchasing/goods-receipts']);
  }

  protected handleReload(): void {
    if (this.receiptId) {
      void this.facade.loadDetail(this.receiptId);
    }
  }

  protected handleCancel(receipt: GoodsReceipt): void {
    void this.facade.cancel(receipt);
  }

  protected formatDate(value: Date | null): string {
    return value ? formatDate(value) : '—';
  }
}
