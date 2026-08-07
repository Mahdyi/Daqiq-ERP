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
  createSalesDeliveryLineTableColumns,
  formatDate
} from '../../config/sales-delivery-table.config';
import { SalesDeliveryFacade } from '../../facades/sales-delivery.facade';
import type { SalesDelivery } from '../../models/sales-delivery.model';

@Component({
  selector: 'daqiq-sales-delivery-detail-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './sales-delivery-detail.page.html',
  styleUrl: './sales-delivery-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesDeliveryDetailPage implements OnInit {
  protected readonly facade = inject(SalesDeliveryFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly deliveryId = this.route.snapshot.paramMap.get('id');
  protected readonly lineColumns = createSalesDeliveryLineTableColumns();
  protected readonly title = computed(() =>
    this.facade.selectedDelivery()?.deliveryNumber
      ? `حواله فروش ${this.facade.selectedDelivery()?.deliveryNumber}`
      : 'جزئیات حواله فروش'
  );

  ngOnInit(): void {
    if (this.deliveryId) {
      void this.facade.loadDetail(this.deliveryId);
    }
  }

  protected handleBack(): void {
    void this.router.navigate(['/sales/sales-deliveries']);
  }

  protected handleReload(): void {
    if (this.deliveryId) {
      void this.facade.loadDetail(this.deliveryId);
    }
  }

  protected handleSalesOrder(delivery: SalesDelivery): void {
    void this.router.navigate(['/sales/sales-orders', delivery.salesOrderId]);
  }

  protected handleCreateInvoice(delivery: SalesDelivery): void {
    void this.router.navigate(['/sales/sales-deliveries', delivery.id, 'invoice']);
  }

  protected handleCancel(delivery: SalesDelivery): void {
    void this.facade.cancel(delivery);
  }

  protected formatDate(value: Date | null): string {
    return value ? formatDate(value) : '—';
  }
}
