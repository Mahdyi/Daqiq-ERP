import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ButtonComponent, CardComponent, DataTableComponent, PageContainerComponent } from '@daqiq/ui';

import { createCashBankAccountTableColumns } from '../../config/cash-bank-account-table.config';
import { CashBankAccountFacade } from '../../facades/cash-bank-account.facade';

@Component({
  selector: 'daqiq-cash-bank-accounts-page',
  imports: [PageContainerComponent, CardComponent, DataTableComponent, ButtonComponent],
  templateUrl: './cash-bank-accounts.page.html',
  styleUrl: './cash-bank-accounts.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashBankAccountsPage implements OnInit {
  protected readonly facade = inject(CashBankAccountFacade);
  protected readonly columns = createCashBankAccountTableColumns();
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
}
