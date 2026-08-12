import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ButtonComponent, CardComponent, DataTableComponent, PageContainerComponent } from '@daqiq/ui';

import { createPaymentSummaryColumns } from '../../config/report-table.config';
import { PaymentReportsFacade } from '../../facades/payment-reports.facade';
import type { PaymentSummaryReport } from '../../models/report-row.model';

@Component({
  selector: 'daqiq-payment-reports-page',
  imports: [PageContainerComponent, CardComponent, DataTableComponent, ButtonComponent],
  templateUrl: './payment-reports.page.html',
  styleUrl: './payment-reports.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentReportsPage implements OnInit {
  protected readonly facade = inject(PaymentReportsFacade);
  protected readonly columns = createPaymentSummaryColumns();
  protected readonly rowKey = (row: PaymentSummaryReport): string => row.paymentDirection;

  ngOnInit(): void {
    void this.facade.loadDefault();
  }

  protected handleRefresh(): void {
    void this.facade.refresh();
  }
}
