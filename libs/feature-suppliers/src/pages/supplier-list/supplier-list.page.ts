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

import { createSupplierTableColumns } from '../../config/supplier-table.config';
import { SupplierFacade } from '../../facades/supplier.facade';
import type { Supplier } from '../../models/supplier.model';

@Component({
  selector: 'daqiq-supplier-list-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './supplier-list.page.html',
  styleUrl: './supplier-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupplierListPage implements OnInit {
  protected readonly facade = inject(SupplierFacade);
  private readonly router = inject(Router);

  protected readonly searchTerm = signal('');
  protected readonly sort = signal<DataTableSort<Supplier> | null>(null);
  protected readonly columns = computed(() =>
    createSupplierTableColumns((id) => this.facade.lookupLabel(id))
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
    void this.router.navigate(['/master-data/suppliers/new']);
  }

  protected handleEdit(supplier: Supplier): void {
    void this.router.navigate(['/master-data/suppliers', supplier.id, 'edit']);
  }

  protected handleDelete(supplier: Supplier): void {
    void this.facade.deleteSupplier(supplier);
  }

  protected handlePageChange(event: DataTablePageEvent): void {
    void this.facade.paginate(event.pageIndex, event.pageSize);
  }

  protected handleSortChange(sort: DataTableSort<Supplier> | null): void {
    this.sort.set(sort);
    void this.facade.sort(sort?.field ?? null, sort?.direction ?? null);
  }
}
