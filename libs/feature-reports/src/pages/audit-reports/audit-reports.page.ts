import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ButtonComponent, CardComponent, DataTableComponent, PageContainerComponent } from '@daqiq/ui';

import { createAuditActivityColumns } from '../../config/report-table.config';
import { AuditReportsFacade } from '../../facades/audit-reports.facade';
import type { AuditActivitySummaryReport } from '../../models/report-row.model';

@Component({
  selector: 'daqiq-audit-reports-page',
  imports: [PageContainerComponent, CardComponent, DataTableComponent, ButtonComponent],
  templateUrl: './audit-reports.page.html',
  styleUrl: './audit-reports.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditReportsPage implements OnInit {
  protected readonly facade = inject(AuditReportsFacade);
  protected readonly columns = createAuditActivityColumns();
  protected readonly rowKey = (row: AuditActivitySummaryReport): string =>
    `${row.action}-${row.entityType}-${row.actorEmail ?? 'system'}`;

  ngOnInit(): void {
    void this.facade.loadDefault();
  }

  protected handleRefresh(): void {
    void this.facade.refresh();
  }
}
