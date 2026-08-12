import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ButtonComponent, CardComponent, DataTableComponent, PageContainerComponent } from '@daqiq/ui';

import {
  createAmountStatusColumns,
  createQuantityStatusColumns,
  createSalesSettlementColumns
} from '../../config/report-table.config';
import { SalesReportsFacade } from '../../facades/sales-reports.facade';
import type {
  AmountStatusReport,
  QuantityStatusReport,
  SalesInvoiceSettlementReport
} from '../../models/report-row.model';

@Component({
  selector: 'daqiq-sales-reports-page',
  imports: [PageContainerComponent, CardComponent, DataTableComponent, ButtonComponent],
  templateUrl: './sales-reports.page.html',
  styleUrl: './sales-reports.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesReportsPage implements OnInit {
  protected readonly facade = inject(SalesReportsFacade);
  protected readonly orderColumns = createAmountStatusColumns('تعداد سفارش');
  protected readonly deliveryColumns = createQuantityStatusColumns('تعداد حواله');
  protected readonly settlementColumns = createSalesSettlementColumns();
  protected readonly statusRowKey = (row: AmountStatusReport | QuantityStatusReport): string =>
    row.statusCode;
  protected readonly settlementRowKey = (row: SalesInvoiceSettlementReport): string =>
    row.customerId;

  ngOnInit(): void {
    void this.facade.loadDefault();
  }

  protected handleRefresh(): void {
    void this.facade.refresh();
  }
}
