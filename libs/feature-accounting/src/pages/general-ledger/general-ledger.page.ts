import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  ButtonComponent,
  CardComponent,
  DataTableComponent,
  EmptyStateComponent,
  PageContainerComponent
} from '@daqiq/ui';

import { createGeneralLedgerTableColumns } from '../../config/general-ledger-table.config';
import { GeneralLedgerFacade } from '../../facades/general-ledger.facade';

@Component({
  selector: 'daqiq-general-ledger-page',
  imports: [PageContainerComponent, CardComponent, DataTableComponent, ButtonComponent, EmptyStateComponent],
  templateUrl: './general-ledger.page.html',
  styleUrl: './general-ledger.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralLedgerPage implements OnInit {
  protected readonly facade = inject(GeneralLedgerFacade);
  protected readonly columns = createGeneralLedgerTableColumns();
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
