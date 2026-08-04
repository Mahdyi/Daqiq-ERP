import { Validators } from '@angular/forms';
import type { FormFieldConfig, FormFieldOption } from '@daqiq/ui';

import type { SalesOrderFormValue } from '../models/sales-order-form-value.model';

export interface SalesOrderHeaderOptions {
  readonly customerOptions: readonly FormFieldOption[];
  readonly currencyOptions: readonly FormFieldOption[];
  readonly warehouseOptions: readonly FormFieldOption[];
}

export function createSalesOrderHeaderFormFields(
  options: SalesOrderHeaderOptions
): readonly FormFieldConfig<SalesOrderFormValue>[] {
  return [
    {
      key: 'customerId',
      kind: 'select',
      label: 'مشتری',
      required: true,
      options: options.customerOptions,
      colSpan: 2
    },
    {
      key: 'orderDate',
      kind: 'date',
      label: 'تاریخ سفارش',
      required: true
    },
    {
      key: 'requestedDeliveryDate',
      kind: 'date',
      label: 'تاریخ تحویل درخواستی'
    },
    {
      key: 'currencyLookupValueId',
      kind: 'select',
      label: 'ارز',
      options: options.currencyOptions
    },
    {
      key: 'deliveryWarehouseId',
      kind: 'select',
      label: 'انبار تحویل',
      options: options.warehouseOptions
    },
    {
      key: 'notes',
      kind: 'textarea',
      label: 'یادداشت',
      rows: 3,
      validators: [Validators.maxLength(1000)],
      colSpan: 2
    }
  ];
}
