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

import { createGoodsReceiptTableColumns } from '../../config/goods-receipt-table.config';
import { GoodsReceiptFacade } from '../../facades/goods-receipt.facade';
import type { GoodsReceipt } from '../../models/goods-receipt.model';

@Component({
  selector: 'daqiq-goods-receipt-list-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './goods-receipt-list.page.html',
  styleUrl: './goods-receipt-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoodsReceiptListPage implements OnInit {
  protected readonly facade = inject(GoodsReceiptFacade);
  private readonly router = inject(Router);
  protected readonly searchTerm = signal('');
  protected readonly sort = signal<DataTableSort<GoodsReceipt> | null>(null);
  protected readonly columns = createGoodsReceiptTableColumns();
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

  protected handleView(receipt: GoodsReceipt): void {
    void this.router.navigate(['/purchasing/goods-receipts', receipt.id]);
  }

  protected handlePageChange(event: DataTablePageEvent): void {
    void this.facade.paginate(event.pageIndex, event.pageSize);
  }

  protected handleSortChange(sort: DataTableSort<GoodsReceipt> | null): void {
    this.sort.set(sort);
    void this.facade.sort(sort?.field ?? null, sort?.direction ?? null);
  }
}
