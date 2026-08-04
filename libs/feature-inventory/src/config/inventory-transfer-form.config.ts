import { Validators } from '@angular/forms';
import type { FormFieldConfig, FormFieldOption } from '@daqiq/ui';

import type { InventoryTransferFormValue } from '../models/inventory-transaction-form-value.model';

export interface InventoryTransferFormOptions {
  readonly productOptions: readonly FormFieldOption[];
  readonly warehouseOptions: readonly FormFieldOption[];
  readonly storageLocationOptions: readonly FormFieldOption[];
}

export function createInventoryTransferFormFields(
  options: InventoryTransferFormOptions
): readonly FormFieldConfig<InventoryTransferFormValue>[] {
  return [
    {
      key: 'productId',
      kind: 'select',
      label: 'کالا',
      required: true,
      options: options.productOptions
    },
    {
      key: 'fromWarehouseId',
      kind: 'select',
      label: 'انبار مبدا',
      required: true,
      options: options.warehouseOptions
    },
    {
      key: 'fromStorageLocationId',
      kind: 'select',
      label: 'موقعیت مبدا',
      options: options.storageLocationOptions
    },
    {
      key: 'toWarehouseId',
      kind: 'select',
      label: 'انبار مقصد',
      required: true,
      options: options.warehouseOptions
    },
    {
      key: 'toStorageLocationId',
      kind: 'select',
      label: 'موقعیت مقصد',
      options: options.storageLocationOptions
    },
    {
      key: 'quantity',
      kind: 'number',
      label: 'مقدار',
      required: true,
      validators: [Validators.min(0.0001)]
    },
    {
      key: 'reason',
      kind: 'textarea',
      label: 'توضیح انتقال',
      rows: 3,
      validators: [Validators.maxLength(500)],
      colSpan: 2
    }
  ];
}
