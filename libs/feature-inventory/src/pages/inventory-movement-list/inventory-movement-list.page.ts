import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  ButtonComponent,
  CardComponent,
  DataTableComponent,
  DataTablePageEvent,
  DataTableSort,
  EmptyStateComponent,
  PageContainerComponent
} from '@daqiq/ui';

import { createInventoryMovementTableColumns } from '../../config/inventory-movement-table.config';
import { InventoryMovementFacade } from '../../facades/inventory-movement.facade';
import type { InventoryMovement } from '../../models/inventory-movement.model';

@Component({
  selector: 'daqiq-inventory-movement-list-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './inventory-movement-list.page.html',
  styleUrl: './inventory-movement-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryMovementListPage implements OnInit {
  protected readonly facade = inject(InventoryMovementFacade);
  protected readonly searchTerm = signal('');
  protected readonly sort = signal<DataTableSort<InventoryMovement> | null>(null);
  protected readonly columns = createInventoryMovementTableColumns();

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

  protected handlePageChange(event: DataTablePageEvent): void {
    void this.facade.paginate(event.pageIndex, event.pageSize);
  }

  protected handleSortChange(sort: DataTableSort<InventoryMovement> | null): void {
    this.sort.set(sort);
    void this.facade.sort(sort?.field ?? null, sort?.direction ?? null);
  }
}
