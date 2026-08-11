import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent, CardComponent, DataTableComponent, PageContainerComponent } from '@daqiq/ui';

import { createCustomerReceiptTableColumns } from '../../config/customer-receipt-table.config';
import { CustomerReceiptFacade } from '../../facades/customer-receipt.facade';
import type { CustomerReceipt } from '../../models/customer-receipt.model';

@Component({
  selector: 'daqiq-customer-receipt-list-page',
  imports: [PageContainerComponent, CardComponent, DataTableComponent, ButtonComponent],
  templateUrl: './customer-receipt-list.page.html',
  styleUrl: './customer-receipt-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerReceiptListPage implements OnInit {
  protected readonly facade = inject(CustomerReceiptFacade);
  private readonly router = inject(Router);
  protected readonly columns = createCustomerReceiptTableColumns();
  protected readonly searchTerm = signal('');

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
    void this.router.navigate(['/payments/customer-receipts/new']);
  }

  protected handleView(receipt: CustomerReceipt): void {
    void this.router.navigate(['/payments/customer-receipts', receipt.id]);
  }
}
