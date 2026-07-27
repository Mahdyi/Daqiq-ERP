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

import { createProductTableColumns } from '../../config/product-table.config';
import { ProductFacade } from '../../facades/product.facade';
import type { Product } from '../../models/product.model';

@Component({
  selector: 'daqiq-product-list-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './product-list.page.html',
  styleUrl: './product-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListPage implements OnInit {
  protected readonly facade = inject(ProductFacade);
  private readonly router = inject(Router);

  protected readonly searchTerm = signal('');
  protected readonly sort = signal<DataTableSort<Product> | null>(null);
  protected readonly columns = computed(() =>
    createProductTableColumns((id) => this.facade.lookupLabel(id))
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
    void this.router.navigate(['/master-data/products/new']);
  }

  protected handleEdit(product: Product): void {
    void this.router.navigate(['/master-data/products', product.id, 'edit']);
  }

  protected handleDelete(product: Product): void {
    void this.facade.deleteProduct(product);
  }

  protected handlePageChange(event: DataTablePageEvent): void {
    void this.facade.paginate(event.pageIndex, event.pageSize);
  }

  protected handleSortChange(sort: DataTableSort<Product> | null): void {
    this.sort.set(sort);
    void this.facade.sort(sort?.field ?? null, sort?.direction ?? null);
  }
}
