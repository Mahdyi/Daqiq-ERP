import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent, CardComponent, EmptyStateComponent, PageContainerComponent } from '@daqiq/ui';

import { formatMoney, formatNumber } from '../../config/sales-invoice-table.config';
import { SalesInvoiceEditorFacade } from '../../facades/sales-invoice-editor.facade';

@Component({
  selector: 'daqiq-sales-invoice-editor-page',
  imports: [PageContainerComponent, CardComponent, ButtonComponent, EmptyStateComponent],
  templateUrl: './sales-invoice-editor.page.html',
  styleUrl: './sales-invoice-editor.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesInvoiceEditorPage implements OnInit {
  protected readonly facade = inject(SalesInvoiceEditorFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly salesDeliveryId = this.route.snapshot.paramMap.get('id');

  ngOnInit(): void {
    if (this.salesDeliveryId) {
      void this.facade.load(this.salesDeliveryId);
    }
  }

  protected handleBack(): void {
    if (this.salesDeliveryId) {
      void this.router.navigate(['/sales/sales-deliveries', this.salesDeliveryId]);
      return;
    }

    void this.router.navigate(['/sales/sales-deliveries']);
  }

  protected handleInvoiceDateChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.facade.setInvoiceDate(target.value);
    }
  }

  protected handleDueDateChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.facade.setDueDate(target.value);
    }
  }

  protected handleNotesInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLTextAreaElement) {
      this.facade.setNotes(target.value);
    }
  }

  protected handleQuantityInput(salesDeliveryLineId: string, event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.facade.updateLineQuantity(salesDeliveryLineId, Number(target.value));
    }
  }

  protected handleUnitPriceInput(salesDeliveryLineId: string, event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.facade.updateLineUnitPrice(salesDeliveryLineId, Number(target.value));
    }
  }

  protected handleTaxRateChange(salesDeliveryLineId: string, event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.facade.updateLineTaxRate(salesDeliveryLineId, target.value);
    }
  }

  protected handleDescriptionInput(salesDeliveryLineId: string, event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.facade.updateLineDescription(salesDeliveryLineId, target.value);
    }
  }

  protected handleSubmit(): void {
    void this.facade.submit();
  }

  protected formatNumber(value: number): string {
    return formatNumber(value);
  }

  protected formatMoney(value: number): string {
    return formatMoney(value);
  }
}
