import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  ButtonComponent,
  CardComponent,
  DataTableComponent,
  EmptyStateComponent,
  PageContainerComponent
} from '@daqiq/ui';

import { createGlAccountTableColumns } from '../../config/gl-account-table.config';
import { GlAccountFacade } from '../../facades/gl-account.facade';

@Component({
  selector: 'daqiq-chart-of-accounts-page',
  imports: [PageContainerComponent, CardComponent, DataTableComponent, ButtonComponent, EmptyStateComponent],
  templateUrl: './chart-of-accounts.page.html',
  styleUrl: './chart-of-accounts.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartOfAccountsPage implements OnInit {
  protected readonly facade = inject(GlAccountFacade);
  protected readonly columns = createGlAccountTableColumns();
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
