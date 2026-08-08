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

import { createSupplierInvoiceTableColumns } from '../../config/supplier-invoice-table.config';
import { SupplierInvoiceFacade } from '../../facades/supplier-invoice.facade';
import type { SupplierInvoice } from '../../models/supplier-invoice.model';

@Component({
  selector: 'daqiq-supplier-invoice-list-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './supplier-invoice-list.page.html',
  styleUrl: './supplier-invoice-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupplierInvoiceListPage implements OnInit {
  protected readonly facade = inject(SupplierInvoiceFacade);
  private readonly router = inject(Router);
  protected readonly searchTerm = signal('');
  protected readonly sort = signal<DataTableSort<SupplierInvoice> | null>(null);
  protected readonly columns = createSupplierInvoiceTableColumns();
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

  protected handleView(invoice: SupplierInvoice): void {
    void this.router.navigate(['/purchasing/supplier-invoices', invoice.id]);
  }

  protected handlePageChange(event: DataTablePageEvent): void {
    void this.facade.paginate(event.pageIndex, event.pageSize);
  }

  protected handleSortChange(sort: DataTableSort<SupplierInvoice> | null): void {
    this.sort.set(sort);
    void this.facade.sort(sort?.field ?? null, sort?.direction ?? null);
  }
}
