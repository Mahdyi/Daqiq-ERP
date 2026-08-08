import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent, CardComponent, EmptyStateComponent, PageContainerComponent } from '@daqiq/ui';

import { formatMoney, formatNumber } from '../../config/supplier-invoice-table.config';
import { SupplierInvoiceEditorFacade } from '../../facades/supplier-invoice-editor.facade';

@Component({
  selector: 'daqiq-supplier-invoice-editor-page',
  imports: [PageContainerComponent, CardComponent, ButtonComponent, EmptyStateComponent],
  templateUrl: './supplier-invoice-editor.page.html',
  styleUrl: './supplier-invoice-editor.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupplierInvoiceEditorPage implements OnInit {
  protected readonly facade = inject(SupplierInvoiceEditorFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly goodsReceiptId = this.route.snapshot.paramMap.get('id');

  ngOnInit(): void {
    if (this.goodsReceiptId) {
      void this.facade.load(this.goodsReceiptId);
    }
  }

  protected handleBack(): void {
    if (this.goodsReceiptId) {
      void this.router.navigate(['/purchasing/goods-receipts', this.goodsReceiptId]);
      return;
    }

    void this.router.navigate(['/purchasing/goods-receipts']);
  }

  protected handleSupplierInvoiceNumberInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.facade.setSupplierInvoiceNumber(target.value);
    }
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

  protected handleQuantityInput(goodsReceiptLineId: string, event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.facade.updateLineQuantity(goodsReceiptLineId, Number(target.value));
    }
  }

  protected handleUnitPriceInput(goodsReceiptLineId: string, event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.facade.updateLineUnitPrice(goodsReceiptLineId, Number(target.value));
    }
  }

  protected handleTaxRateChange(goodsReceiptLineId: string, event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.facade.updateLineTaxRate(goodsReceiptLineId, target.value);
    }
  }

  protected handleDescriptionInput(goodsReceiptLineId: string, event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.facade.updateLineDescription(goodsReceiptLineId, target.value);
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
