import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent, CardComponent, DataTableComponent, PageContainerComponent } from '@daqiq/ui';

import { createSupplierPaymentTableColumns } from '../../config/supplier-payment-table.config';
import { SupplierPaymentFacade } from '../../facades/supplier-payment.facade';
import type { SupplierPayment } from '../../models/supplier-payment.model';

@Component({
  selector: 'daqiq-supplier-payment-list-page',
  imports: [PageContainerComponent, CardComponent, DataTableComponent, ButtonComponent],
  templateUrl: './supplier-payment-list.page.html',
  styleUrl: './supplier-payment-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupplierPaymentListPage implements OnInit {
  protected readonly facade = inject(SupplierPaymentFacade);
  private readonly router = inject(Router);
  protected readonly columns = createSupplierPaymentTableColumns();
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
    void this.router.navigate(['/payments/supplier-payments/new']);
  }

  protected handleView(payment: SupplierPayment): void {
    void this.router.navigate(['/payments/supplier-payments', payment.id]);
  }
}
