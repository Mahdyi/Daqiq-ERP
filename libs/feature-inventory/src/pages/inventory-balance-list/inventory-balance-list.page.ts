import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
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

import { createInventoryBalanceTableColumns } from '../../config/inventory-balance-table.config';
import { InventoryBalanceFacade } from '../../facades/inventory-balance.facade';
import type { InventoryBalance } from '../../models/inventory-balance.model';

@Component({
  selector: 'daqiq-inventory-balance-list-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './inventory-balance-list.page.html',
  styleUrl: './inventory-balance-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryBalanceListPage implements OnInit {
  protected readonly facade = inject(InventoryBalanceFacade);
  private readonly router = inject(Router);

  protected readonly searchTerm = signal('');
  protected readonly sort = signal<DataTableSort<InventoryBalance> | null>(null);
  protected readonly columns = createInventoryBalanceTableColumns();

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

  protected handleAdjustment(): void {
    void this.router.navigate(['/inventory/adjustment']);
  }

  protected handleTransfer(): void {
    void this.router.navigate(['/inventory/transfer']);
  }

  protected handleMovements(): void {
    void this.router.navigate(['/inventory/movements']);
  }

  protected handlePageChange(event: DataTablePageEvent): void {
    void this.facade.paginate(event.pageIndex, event.pageSize);
  }

  protected handleSortChange(sort: DataTableSort<InventoryBalance> | null): void {
    this.sort.set(sort);
    void this.facade.sort(sort?.field ?? null, sort?.direction ?? null);
  }
}
