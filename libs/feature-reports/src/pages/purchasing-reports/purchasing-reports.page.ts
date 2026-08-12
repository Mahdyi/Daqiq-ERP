import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ButtonComponent, CardComponent, DataTableComponent, PageContainerComponent } from '@daqiq/ui';

import {
  createAmountStatusColumns,
  createQuantityStatusColumns,
  createSupplierSettlementColumns
} from '../../config/report-table.config';
import { PurchasingReportsFacade } from '../../facades/purchasing-reports.facade';
import type {
  AmountStatusReport,
  QuantityStatusReport,
  SupplierInvoiceSettlementReport
} from '../../models/report-row.model';

@Component({
  selector: 'daqiq-purchasing-reports-page',
  imports: [PageContainerComponent, CardComponent, DataTableComponent, ButtonComponent],
  templateUrl: './purchasing-reports.page.html',
  styleUrl: './purchasing-reports.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchasingReportsPage implements OnInit {
  protected readonly facade = inject(PurchasingReportsFacade);
  protected readonly orderColumns = createAmountStatusColumns('تعداد سفارش');
  protected readonly receiptColumns = createQuantityStatusColumns('تعداد رسید');
  protected readonly settlementColumns = createSupplierSettlementColumns();
  protected readonly statusRowKey = (row: AmountStatusReport | QuantityStatusReport): string =>
    row.statusCode;
  protected readonly settlementRowKey = (row: SupplierInvoiceSettlementReport): string =>
    row.supplierId;

  ngOnInit(): void {
    void this.facade.loadDefault();
  }

  protected handleRefresh(): void {
    void this.facade.refresh();
  }
}
