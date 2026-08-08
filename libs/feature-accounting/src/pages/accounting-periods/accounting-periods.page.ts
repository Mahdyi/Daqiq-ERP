import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import {
  ButtonComponent,
  CardComponent,
  DataTableComponent,
  EmptyStateComponent,
  PageContainerComponent
} from '@daqiq/ui';

import { createAccountingPeriodTableColumns } from '../../config/accounting-period-table.config';
import { AccountingPeriodFacade } from '../../facades/accounting-period.facade';

@Component({
  selector: 'daqiq-accounting-periods-page',
  imports: [PageContainerComponent, CardComponent, DataTableComponent, ButtonComponent, EmptyStateComponent],
  templateUrl: './accounting-periods.page.html',
  styleUrl: './accounting-periods.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountingPeriodsPage implements OnInit {
  protected readonly facade = inject(AccountingPeriodFacade);
  protected readonly columns = createAccountingPeriodTableColumns();

  ngOnInit(): void {
    void this.facade.load();
  }

  protected handleRefresh(): void {
    void this.facade.load();
  }
}
