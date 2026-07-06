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

import { CUSTOMER_TABLE_COLUMNS } from '../../config/customer-table.config';
import { CustomerFacade } from '../../facades/customer.facade';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'daqiq-customer-list-page',
  imports: [
    PageContainerComponent,
    CardComponent,
    DataTableComponent,
    ButtonComponent,
    EmptyStateComponent
  ],
  templateUrl: './customer-list.page.html',
  styleUrl: './customer-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerListPage implements OnInit {
  protected readonly facade = inject(CustomerFacade);
  private readonly router = inject(Router);

  protected readonly columns = CUSTOMER_TABLE_COLUMNS;
  protected readonly searchTerm = signal('');
  protected readonly sort = signal<DataTableSort<Customer> | null>(null);
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
    void this.facade.refresh();
  }

  protected handleCreate(): void {
    void this.router.navigate(['/master-data/customers/new']);
  }

  protected handleEdit(customer: Customer): void {
    void this.router.navigate(['/master-data/customers', customer.id, 'edit']);
  }

  protected handleDelete(customer: Customer): void {
    void this.facade.deleteCustomer(customer);
  }

  protected handlePageChange(event: DataTablePageEvent): void {
    void this.facade.paginate(event.pageIndex, event.pageSize);
  }

  protected handleSortChange(sort: DataTableSort<Customer> | null): void {
    this.sort.set(sort);
    void this.facade.sort(sort?.field ?? null, sort?.direction ?? null);
  }
}
