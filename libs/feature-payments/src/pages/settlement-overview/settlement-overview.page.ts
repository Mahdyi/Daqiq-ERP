import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ButtonComponent, CardComponent, DataTableComponent, PageContainerComponent } from '@daqiq/ui';

import {
  createSalesSettlementTableColumns,
  createSupplierSettlementTableColumns
} from '../../config/invoice-settlement-table.config';
import { SettlementFacade } from '../../facades/settlement.facade';

@Component({
  selector: 'daqiq-settlement-overview-page',
  imports: [PageContainerComponent, CardComponent, DataTableComponent, ButtonComponent],
  templateUrl: './settlement-overview.page.html',
  styleUrl: './settlement-overview.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettlementOverviewPage implements OnInit {
  protected readonly facade = inject(SettlementFacade);
  protected readonly salesColumns = createSalesSettlementTableColumns();
  protected readonly supplierColumns = createSupplierSettlementTableColumns();

  ngOnInit(): void {
    void this.facade.loadDefault();
  }

  protected handleRefresh(): void {
    void this.facade.refresh();
  }
}
