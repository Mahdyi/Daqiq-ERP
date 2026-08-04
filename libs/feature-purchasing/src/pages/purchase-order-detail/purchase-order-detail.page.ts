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
  createPurchaseOrderLineTableColumns,
  formatDate,
  formatNumber
} from '../../config/purchase-order-table.config';
import { PurchaseOrderFacade } from '../../facades/purchase-order.facade';
import type { PurchaseOrder } from '../../models/purchase-order.model';

@Component({
  selector: 'daqiq-purchase-order-detail-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './purchase-order-detail.page.html',
  styleUrl: './purchase-order-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchaseOrderDetailPage implements OnInit {
  protected readonly facade = inject(PurchaseOrderFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly orderId = this.route.snapshot.paramMap.get('id');
  protected readonly lineColumns = createPurchaseOrderLineTableColumns();
  protected readonly title = computed(() =>
    this.facade.selectedOrder()?.orderNumber
      ? `سفارش خرید ${this.facade.selectedOrder()?.orderNumber}`
      : 'جزئیات سفارش خرید'
  );

  ngOnInit(): void {
    if (this.orderId) {
      void this.facade.loadDetail(this.orderId);
    }
  }

  protected handleBack(): void {
    void this.router.navigate(['/purchasing/purchase-orders']);
  }

  protected handleEdit(order: PurchaseOrder): void {
    void this.router.navigate(['/purchasing/purchase-orders', order.id, 'edit']);
  }

  protected handleReload(): void {
    if (this.orderId) {
      void this.facade.loadDetail(this.orderId);
    }
  }

  protected handleSubmit(order: PurchaseOrder): void {
    void this.facade.submit(order);
  }

  protected handleApprove(order: PurchaseOrder): void {
    void this.facade.approve(order);
  }

  protected handleCancel(order: PurchaseOrder): void {
    void this.facade.cancel(order);
  }

  protected handleClose(order: PurchaseOrder): void {
    void this.facade.close(order);
  }

  protected formatDate(value: Date | null): string {
    return value ? formatDate(value) : '—';
  }

  protected formatNumber(value: number): string {
    return formatNumber(value);
  }
}
