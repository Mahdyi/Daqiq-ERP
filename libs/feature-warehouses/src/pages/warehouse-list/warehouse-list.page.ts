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

import { createWarehouseTableColumns } from '../../config/warehouse-table.config';
import { WarehouseFacade } from '../../facades/warehouse.facade';
import type { Warehouse } from '../../models/warehouse.model';

@Component({
  selector: 'daqiq-warehouse-list-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './warehouse-list.page.html',
  styleUrl: './warehouse-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarehouseListPage implements OnInit {
  protected readonly facade = inject(WarehouseFacade);
  private readonly router = inject(Router);

  protected readonly searchTerm = signal('');
  protected readonly sort = signal<DataTableSort<Warehouse> | null>(null);
  protected readonly columns = computed(() =>
    createWarehouseTableColumns((id) => this.facade.lookupLabel(id))
  );
  protected readonly pageIndex = computed(() => this.facade.query()?.page ?? 0);
  protected readonly pageSize = computed(() => this.facade.query()?.pageSize ?? 20);

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
    void this.facade.loadDefault();
  }

  protected handleCreate(): void {
    void this.router.navigate(['/master-data/warehouses/new']);
  }

  protected handleEdit(warehouse: Warehouse): void {
    void this.router.navigate(['/master-data/warehouses', warehouse.id, 'edit']);
  }

  protected handleDelete(warehouse: Warehouse): void {
    void this.facade.deleteWarehouse(warehouse);
  }

  protected handlePageChange(event: DataTablePageEvent): void {
    void this.facade.paginate(event.pageIndex, event.pageSize);
  }

  protected handleSortChange(sort: DataTableSort<Warehouse> | null): void {
    this.sort.set(sort);
    void this.facade.sort(sort?.field ?? null, sort?.direction ?? null);
  }
}
