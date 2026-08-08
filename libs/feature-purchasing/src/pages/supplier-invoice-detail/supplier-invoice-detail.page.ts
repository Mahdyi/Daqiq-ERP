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
  createSupplierInvoiceLineTableColumns,
  formatDate,
  formatMoney
} from '../../config/supplier-invoice-table.config';
import { SupplierInvoiceFacade } from '../../facades/supplier-invoice.facade';
import type { SupplierInvoice } from '../../models/supplier-invoice.model';

@Component({
  selector: 'daqiq-supplier-invoice-detail-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './supplier-invoice-detail.page.html',
  styleUrl: './supplier-invoice-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupplierInvoiceDetailPage implements OnInit {
  protected readonly facade = inject(SupplierInvoiceFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly invoiceId = this.route.snapshot.paramMap.get('id');
  protected readonly lineColumns = createSupplierInvoiceLineTableColumns();
  protected readonly title = computed(() =>
    this.facade.selectedInvoice()?.invoiceNumber
      ? `فاکتور تأمین‌کننده ${this.facade.selectedInvoice()?.invoiceNumber}`
      : 'جزئیات فاکتور تأمین‌کننده'
  );

  ngOnInit(): void {
    if (this.invoiceId) {
      void this.facade.loadDetail(this.invoiceId);
    }
  }

  protected handleBack(): void {
    void this.router.navigate(['/purchasing/supplier-invoices']);
  }

  protected handleReload(): void {
    if (this.invoiceId) {
      void this.facade.loadDetail(this.invoiceId);
    }
  }

  protected handlePurchaseOrder(invoice: SupplierInvoice): void {
    if (invoice.purchaseOrderId) {
      void this.router.navigate(['/purchasing/purchase-orders', invoice.purchaseOrderId]);
    }
  }

  protected handleGoodsReceipt(invoice: SupplierInvoice): void {
    if (invoice.goodsReceiptId) {
      void this.router.navigate(['/purchasing/goods-receipts', invoice.goodsReceiptId]);
    }
  }

  protected handlePost(invoice: SupplierInvoice): void {
    void this.facade.post(invoice);
  }

  protected handleCancel(invoice: SupplierInvoice): void {
    void this.facade.cancel(invoice);
  }

  protected formatDate(value: Date | null): string {
    return value ? formatDate(value) : '—';
  }

  protected formatMoney(value: number): string {
    return formatMoney(value);
  }
}
