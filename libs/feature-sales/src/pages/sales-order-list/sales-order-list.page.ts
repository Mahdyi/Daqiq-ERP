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

import { createSalesOrderTableColumns } from '../../config/sales-order-table.config';
import { SalesOrderFacade } from '../../facades/sales-order.facade';
import type { SalesOrder } from '../../models/sales-order.model';

@Component({
  selector: 'daqiq-sales-order-list-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './sales-order-list.page.html',
  styleUrl: './sales-order-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesOrderListPage implements OnInit {
  protected readonly facade = inject(SalesOrderFacade);
  private readonly router = inject(Router);
  protected readonly searchTerm = signal('');
  protected readonly sort = signal<DataTableSort<SalesOrder> | null>(null);
  protected readonly columns = createSalesOrderTableColumns();
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

  protected handleCreate(): void {
    void this.router.navigate(['/sales/sales-orders/new']);
  }

  protected handleView(order: SalesOrder): void {
    void this.router.navigate(['/sales/sales-orders', order.id]);
  }

  protected handleEdit(order: SalesOrder): void {
    void this.router.navigate(['/sales/sales-orders', order.id, 'edit']);
  }

  protected handlePageChange(event: DataTablePageEvent): void {
    void this.facade.paginate(event.pageIndex, event.pageSize);
  }

  protected handleSortChange(sort: DataTableSort<SalesOrder> | null): void {
    this.sort.set(sort);
    void this.facade.sort(sort?.field ?? null, sort?.direction ?? null);
  }
}

