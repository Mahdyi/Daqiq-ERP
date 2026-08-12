import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ButtonComponent, CardComponent, DataTableComponent, PageContainerComponent } from '@daqiq/ui';

import {
  createInventoryMovementSummaryColumns,
  createInventoryOnHandColumns
} from '../../config/report-table.config';
import { InventoryReportsFacade } from '../../facades/inventory-reports.facade';
import type {
  InventoryMovementSummaryReport,
  InventoryOnHandReport
} from '../../models/report-row.model';

@Component({
  selector: 'daqiq-inventory-reports-page',
  imports: [PageContainerComponent, CardComponent, DataTableComponent, ButtonComponent],
  templateUrl: './inventory-reports.page.html',
  styleUrl: './inventory-reports.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryReportsPage implements OnInit {
  protected readonly facade = inject(InventoryReportsFacade);
  protected readonly onHandColumns = createInventoryOnHandColumns();
  protected readonly movementColumns = createInventoryMovementSummaryColumns();
  protected readonly onHandRowKey = (row: InventoryOnHandReport): string =>
    `${row.productId}-${row.warehouseId}-${row.storageLocationId ?? 'none'}`;
  protected readonly movementRowKey = (row: InventoryMovementSummaryReport): string =>
    `${row.productId}-${row.warehouseId ?? 'none'}-${row.movementTypeCode}`;

  ngOnInit(): void {
    void this.facade.loadDefault();
  }

  protected handleRefresh(): void {
    void this.facade.refresh();
  }
}
