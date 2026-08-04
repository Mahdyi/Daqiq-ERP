import { Validators } from '@angular/forms';
import type { FormFieldConfig, FormFieldOption } from '@daqiq/ui';

import type { InventoryAdjustmentFormValue } from '../models/inventory-transaction-form-value.model';

export interface InventoryAdjustmentFormOptions {
  readonly productOptions: readonly FormFieldOption[];
  readonly warehouseOptions: readonly FormFieldOption[];
  readonly storageLocationOptions: readonly FormFieldOption[];
}

const MOVEMENT_DIRECTION_OPTIONS: readonly FormFieldOption[] = [
  {
    label: 'افزایش موجودی',
    value: 'in'
  },
  {
    label: 'کاهش موجودی',
    value: 'out'
  }
];

export function createInventoryAdjustmentFormFields(
  options: InventoryAdjustmentFormOptions
): readonly FormFieldConfig<InventoryAdjustmentFormValue>[] {
  return [
    {
      key: 'movementDirection',
      kind: 'select',
      label: 'نوع اصلاح',
      required: true,
      initialValue: 'in',
      options: MOVEMENT_DIRECTION_OPTIONS
    },
    {
      key: 'productId',
      kind: 'select',
      label: 'کالا',
      required: true,
      options: options.productOptions
    },
    {
      key: 'warehouseId',
      kind: 'select',
      label: 'انبار',
      required: true,
      options: options.warehouseOptions
    },
    {
      key: 'storageLocationId',
      kind: 'select',
      label: 'موقعیت انبار',
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
      label: 'دلیل اصلاح',
      required: true,
      rows: 3,
      validators: [Validators.minLength(3), Validators.maxLength(500)],
      colSpan: 2
    }
  ];
}
