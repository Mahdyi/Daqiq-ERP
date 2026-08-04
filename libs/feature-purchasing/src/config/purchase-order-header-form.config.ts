import { Validators } from '@angular/forms';
import type { FormFieldConfig, FormFieldOption } from '@daqiq/ui';

import type { PurchaseOrderFormValue } from '../models/purchase-order-form-value.model';

export interface PurchaseOrderHeaderOptions {
  readonly supplierOptions: readonly FormFieldOption[];
  readonly currencyOptions: readonly FormFieldOption[];
  readonly warehouseOptions: readonly FormFieldOption[];
}

export function createPurchaseOrderHeaderFormFields(
  options: PurchaseOrderHeaderOptions
): readonly FormFieldConfig<PurchaseOrderFormValue>[] {
  return [
    {
      key: 'supplierId',
      kind: 'select',
      label: 'تأمین‌کننده',
      required: true,
      options: options.supplierOptions,
      colSpan: 2
    },
    {
      key: 'orderDate',
      kind: 'date',
      label: 'تاریخ سفارش',
      required: true
    },
    {
      key: 'expectedDate',
      kind: 'date',
      label: 'تاریخ مورد انتظار'
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
