import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent, CardComponent, EmptyStateComponent, PageContainerComponent } from '@daqiq/ui';

import { formatNumber } from '../../config/sales-delivery-table.config';
import { SalesDeliveryPostingFacade } from '../../facades/sales-delivery-posting.facade';

@Component({
  selector: 'daqiq-sales-delivery-posting-page',
  imports: [PageContainerComponent, CardComponent, ButtonComponent, EmptyStateComponent],
  templateUrl: './sales-delivery-posting.page.html',
  styleUrl: './sales-delivery-posting.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesDeliveryPostingPage implements OnInit {
  protected readonly facade = inject(SalesDeliveryPostingFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly salesOrderId = this.route.snapshot.paramMap.get('id');

  ngOnInit(): void {
    if (this.salesOrderId) {
      void this.facade.load(this.salesOrderId);
    }
  }

  protected handleBack(): void {
    if (this.salesOrderId) {
      void this.router.navigate(['/sales/sales-orders', this.salesOrderId]);
      return;
    }

    void this.router.navigate(['/sales/sales-orders']);
  }

  protected handleWarehouseChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      void this.facade.changeWarehouse(target.value);
    }
  }

  protected handleDateChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.facade.setDeliveryDate(target.value);
    }
  }

  protected handleNotesInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLTextAreaElement) {
      this.facade.setNotes(target.value);
    }
  }

  protected handleQuantityInput(salesOrderLineId: string, event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.facade.updateLineQuantity(salesOrderLineId, Number(target.value));
    }
  }

  protected handleLocationChange(salesOrderLineId: string, event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.facade.updateLineLocation(salesOrderLineId, target.value);
    }
  }

  protected handleLineNotesInput(salesOrderLineId: string, event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.facade.updateLineNotes(salesOrderLineId, target.value);
    }
  }

  protected handleSubmit(): void {
    void this.facade.submit();
  }

  protected formatNumber(value: number): string {
    return formatNumber(value);
  }
}
