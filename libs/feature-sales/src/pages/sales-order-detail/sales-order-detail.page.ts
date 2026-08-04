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
  createSalesOrderLineTableColumns,
  formatDate,
  formatNumber
} from '../../config/sales-order-table.config';
import { SalesOrderFacade } from '../../facades/sales-order.facade';
import type { SalesOrder } from '../../models/sales-order.model';

@Component({
  selector: 'daqiq-sales-order-detail-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './sales-order-detail.page.html',
  styleUrl: './sales-order-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesOrderDetailPage implements OnInit {
  protected readonly facade = inject(SalesOrderFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly orderId = this.route.snapshot.paramMap.get('id');
  protected readonly lineColumns = createSalesOrderLineTableColumns();
  protected readonly title = computed(() =>
    this.facade.selectedOrder()?.orderNumber
      ? `سفارش فروش ${this.facade.selectedOrder()?.orderNumber}`
      : 'جزئیات سفارش فروش'
  );

  ngOnInit(): void {
    if (this.orderId) {
      void this.facade.loadDetail(this.orderId);
    }
  }

  protected handleBack(): void {
    void this.router.navigate(['/sales/sales-orders']);
  }

  protected handleEdit(order: SalesOrder): void {
    void this.router.navigate(['/sales/sales-orders', order.id, 'edit']);
  }

  protected handleReload(): void {
    if (this.orderId) {
      void this.facade.loadDetail(this.orderId);
    }
  }

  protected handleSubmit(order: SalesOrder): void {
    void this.facade.submit(order);
  }

  protected handleConfirm(order: SalesOrder): void {
    void this.facade.confirm(order);
  }

  protected handleCancel(order: SalesOrder): void {
    void this.facade.cancel(order);
  }

  protected handleClose(order: SalesOrder): void {
    void this.facade.close(order);
  }

  protected handleDeliver(order: SalesOrder): void {
    void this.router.navigate(['/sales/sales-orders', order.id, 'deliver']);
  }

  protected formatDate(value: Date | null): string {
    return value ? formatDate(value) : '—';
  }

  protected formatNumber(value: number): string {
    return formatNumber(value);
  }
}

