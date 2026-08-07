import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  DataTableComponent,
  DataTablePageEvent,
  DataTableSort,
  EmptyStateComponent,
  PageContainerComponent
} from '@daqiq/ui';

import { createSalesInvoiceTableColumns } from '../../config/sales-invoice-table.config';
import { SalesInvoiceFacade } from '../../facades/sales-invoice.facade';
import type { SalesInvoice } from '../../models/sales-invoice.model';

@Component({
  selector: 'daqiq-sales-invoice-list-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './sales-invoice-list.page.html',
  styleUrl: './sales-invoice-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesInvoiceListPage implements OnInit {
  protected readonly facade = inject(SalesInvoiceFacade);
  private readonly router = inject(Router);
  protected readonly searchTerm = signal('');
  protected readonly sort = signal<DataTableSort<SalesInvoice> | null>(null);
  protected readonly columns = createSalesInvoiceTableColumns();
  protected readonly pageIndex = computed(() => this.facade.page()?.page ?? 0);
  protected readonly pageSize = computed(() => this.facade.page()?.pageSize ?? 20);

  ngOnInit(): void {
    void this.facade.loadDefault();
  }

  protected handleSearchInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.searchTerm.set(target.value);
    }
  }

  protected handleSearchSubmit(): void {
    void this.facade.search(this.searchTerm());
  }

  protected handleRefresh(): void {
    void this.facade.refresh();
  }

  protected handleView(invoice: SalesInvoice): void {
    void this.router.navigate(['/sales/sales-invoices', invoice.id]);
  }

  protected handlePageChange(event: DataTablePageEvent): void {
    void this.facade.paginate(event.pageIndex, event.pageSize);
  }

  protected handleSortChange(sort: DataTableSort<SalesInvoice> | null): void {
    this.sort.set(sort);
    void this.facade.sort(sort?.field ?? null, sort?.direction ?? null);
  }
}
