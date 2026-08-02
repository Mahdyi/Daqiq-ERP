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

import { createStorageLocationTableColumns } from '../../config/storage-location-table.config';
import { StorageLocationFacade } from '../../facades/storage-location.facade';
import type { StorageLocation } from '../../models/storage-location.model';

@Component({
  selector: 'daqiq-storage-location-list-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './storage-location-list.page.html',
  styleUrl: './storage-location-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorageLocationListPage implements OnInit {
  protected readonly facade = inject(StorageLocationFacade);
  private readonly router = inject(Router);

  protected readonly searchTerm = signal('');
  protected readonly sort = signal<DataTableSort<StorageLocation> | null>(null);
  protected readonly columns = computed(() =>
    createStorageLocationTableColumns(
      (id) => this.facade.warehouseLabel(id),
      (id) => this.facade.lookupLabel(id),
      (id) => this.facade.locationLabel(id)
    )
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
    void this.router.navigate(['/master-data/storage-locations/new']);
  }

  protected handleEdit(location: StorageLocation): void {
    void this.router.navigate(['/master-data/storage-locations', location.id, 'edit']);
  }

  protected handleDelete(location: StorageLocation): void {
    void this.facade.deleteLocation(location);
  }

  protected handlePageChange(event: DataTablePageEvent): void {
    void this.facade.paginate(event.pageIndex, event.pageSize);
  }

  protected handleSortChange(sort: DataTableSort<StorageLocation> | null): void {
    this.sort.set(sort);
    void this.facade.sort(sort?.field ?? null, sort?.direction ?? null);
  }
}
