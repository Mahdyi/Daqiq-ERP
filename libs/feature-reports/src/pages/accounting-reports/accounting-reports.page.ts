import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ButtonComponent, CardComponent, DataTableComponent, PageContainerComponent } from '@daqiq/ui';

import {
  createGeneralLedgerSummaryColumns,
  createJournalActivityColumns
} from '../../config/report-table.config';
import { AccountingReportsFacade } from '../../facades/accounting-reports.facade';
import type { GeneralLedgerSummaryReport, JournalActivityReport } from '../../models/report-row.model';

@Component({
  selector: 'daqiq-accounting-reports-page',
  imports: [PageContainerComponent, CardComponent, DataTableComponent, ButtonComponent],
  templateUrl: './accounting-reports.page.html',
  styleUrl: './accounting-reports.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountingReportsPage implements OnInit {
  protected readonly facade = inject(AccountingReportsFacade);
  protected readonly ledgerColumns = createGeneralLedgerSummaryColumns();
  protected readonly activityColumns = createJournalActivityColumns();
  protected readonly ledgerRowKey = (row: GeneralLedgerSummaryReport): string => row.accountId;
  protected readonly activityRowKey = (row: JournalActivityReport): string => row.sourceTypeCode;

  ngOnInit(): void {
    void this.facade.loadDefault();
  }

  protected handleRefresh(): void {
    void this.facade.refresh();
  }
}
