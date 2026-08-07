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
  createSalesInvoiceLineTableColumns,
  formatDate,
  formatMoney
} from '../../config/sales-invoice-table.config';
import { SalesInvoiceFacade } from '../../facades/sales-invoice.facade';
import type { SalesInvoice } from '../../models/sales-invoice.model';

@Component({
  selector: 'daqiq-sales-invoice-detail-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './sales-invoice-detail.page.html',
  styleUrl: './sales-invoice-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesInvoiceDetailPage implements OnInit {
  protected readonly facade = inject(SalesInvoiceFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly invoiceId = this.route.snapshot.paramMap.get('id');
  protected readonly lineColumns = createSalesInvoiceLineTableColumns();
  protected readonly title = computed(() =>
    this.facade.selectedInvoice()?.invoiceNumber
      ? `فاکتور فروش ${this.facade.selectedInvoice()?.invoiceNumber}`
      : 'جزئیات فاکتور فروش'
  );

  ngOnInit(): void {
    if (this.invoiceId) {
      void this.facade.loadDetail(this.invoiceId);
    }
  }

  protected handleBack(): void {
    void this.router.navigate(['/sales/sales-invoices']);
  }

  protected handleReload(): void {
    if (this.invoiceId) {
      void this.facade.loadDetail(this.invoiceId);
    }
  }

  protected handleSalesOrder(invoice: SalesInvoice): void {
    if (invoice.salesOrderId) {
      void this.router.navigate(['/sales/sales-orders', invoice.salesOrderId]);
    }
  }

  protected handleSalesDelivery(invoice: SalesInvoice): void {
    if (invoice.salesDeliveryId) {
      void this.router.navigate(['/sales/sales-deliveries', invoice.salesDeliveryId]);
    }
  }

  protected handleIssue(invoice: SalesInvoice): void {
    void this.facade.issue(invoice);
  }

  protected handleCancel(invoice: SalesInvoice): void {
    void this.facade.cancel(invoice);
  }

  protected formatDate(value: Date | null): string {
    return value ? formatDate(value) : '—';
  }

  protected formatMoney(value: number): string {
    return formatMoney(value);
  }
}
