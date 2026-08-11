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
import { CustomerReceiptFacade } from '../../facades/customer-receipt.facade';
import type { CustomerReceiptAllocation } from '../../models/customer-receipt.model';

@Component({
  selector: 'daqiq-customer-receipt-detail-page',
  imports: [PageContainerComponent, CardComponent, DataTableComponent, ButtonComponent, RouterLink],
  templateUrl: './customer-receipt-detail.page.html',
  styleUrl: './customer-receipt-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerReceiptDetailPage implements OnInit {
  protected readonly facade = inject(CustomerReceiptFacade);
  private readonly route = inject(ActivatedRoute);
  protected readonly allocationColumns: readonly DataTableColumn<CustomerReceiptAllocation>[] = [
    { id: 'invoiceNumber', field: 'invoiceNumber', header: 'شماره فاکتور' },
    {
      id: 'allocatedAmount',
      field: 'allocatedAmount',
      header: 'مبلغ تخصیص',
      align: 'end' as const,
      formatter: (_value: unknown, row: CustomerReceiptAllocation) =>
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
