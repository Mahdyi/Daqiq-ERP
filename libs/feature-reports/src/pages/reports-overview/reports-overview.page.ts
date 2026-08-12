import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardComponent, EmptyStateComponent, PageContainerComponent } from '@daqiq/ui';

import { ReportDashboardFacade } from '../../facades/report-dashboard.facade';

@Component({
  selector: 'daqiq-reports-overview-page',
  imports: [RouterLink, PageContainerComponent, CardComponent, EmptyStateComponent],
  templateUrl: './reports-overview.page.html',
  styleUrl: './reports-overview.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsOverviewPage {
  protected readonly facade = inject(ReportDashboardFacade);
}
