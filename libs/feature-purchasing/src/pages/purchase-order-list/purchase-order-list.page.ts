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

import { createPurchaseOrderTableColumns } from '../../config/purchase-order-table.config';
import { PurchaseOrderFacade } from '../../facades/purchase-order.facade';
import type { PurchaseOrder } from '../../models/purchase-order.model';

@Component({
  selector: 'daqiq-purchase-order-list-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './purchase-order-list.page.html',
  styleUrl: './purchase-order-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchaseOrderListPage implements OnInit {
  protected readonly facade = inject(PurchaseOrderFacade);
  private readonly router = inject(Router);
  protected readonly searchTerm = signal('');
  protected readonly sort = signal<DataTableSort<PurchaseOrder> | null>(null);
  protected readonly columns = createPurchaseOrderTableColumns();
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
    void this.router.navigate(['/purchasing/purchase-orders/new']);
  }

  protected handleView(order: PurchaseOrder): void {
    void this.router.navigate(['/purchasing/purchase-orders', order.id]);
  }

  protected handleEdit(order: PurchaseOrder): void {
    void this.router.navigate(['/purchasing/purchase-orders', order.id, 'edit']);
  }

  protected handleReceive(order: PurchaseOrder): void {
    void this.router.navigate(['/purchasing/purchase-orders', order.id, 'receive']);
  }

  protected handlePageChange(event: DataTablePageEvent): void {
    void this.facade.paginate(event.pageIndex, event.pageSize);
  }

  protected handleSortChange(sort: DataTableSort<PurchaseOrder> | null): void {
    this.sort.set(sort);
    void this.facade.sort(sort?.field ?? null, sort?.direction ?? null);
  }
}
