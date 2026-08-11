import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  DataTableComponent,
  PageContainerComponent,
  type DataTableColumn
} from '@daqiq/ui';

import { formatDate, formatMoney, formatNullable } from '../../config/payment-format.util';
import { SupplierPaymentFacade } from '../../facades/supplier-payment.facade';
import type { SupplierPaymentAllocation } from '../../models/supplier-payment.model';

@Component({
  selector: 'daqiq-supplier-payment-detail-page',
  imports: [PageContainerComponent, CardComponent, DataTableComponent, ButtonComponent, RouterLink],
  templateUrl: './supplier-payment-detail.page.html',
  styleUrl: './supplier-payment-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupplierPaymentDetailPage implements OnInit {
  protected readonly facade = inject(SupplierPaymentFacade);
  private readonly route = inject(ActivatedRoute);
  protected readonly allocationColumns: readonly DataTableColumn<SupplierPaymentAllocation>[] = [
    { id: 'invoiceNumber', field: 'invoiceNumber', header: 'شماره فاکتور' },
    {
      id: 'allocatedAmount',
      field: 'allocatedAmount',
      header: 'مبلغ تخصیص',
      align: 'end' as const,
      formatter: (_value: unknown, row: SupplierPaymentAllocation) =>
        formatMoney(row.allocatedAmount)
    }
  ];
  protected readonly formatDate = formatDate;
  protected readonly formatMoney = formatMoney;
  protected readonly formatNullable = formatNullable;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      void this.facade.loadDetail(id);
    }
  }
}
