import { Validators } from '@angular/forms';
import type { FormFieldConfig, FormFieldOption } from '@daqiq/ui';
import type { StorageLocationFormValue } from '../models/storage-location-form-value.model';

export interface StorageLocationFormOptions {
  readonly warehouseOptions: readonly FormFieldOption[];
  readonly locationTypeOptions: readonly FormFieldOption[];
  readonly parentLocationOptions: readonly FormFieldOption[];
}

export function createStorageLocationFormFields(
  options: StorageLocationFormOptions
): readonly FormFieldConfig<StorageLocationFormValue>[] {
  return [
    { key: 'warehouseId', kind: 'select', label: 'انبار', required: true, options: options.warehouseOptions },
    { key: 'code', kind: 'text', label: 'کد موقعیت', required: true, validators: [Validators.minLength(1), Validators.maxLength(64)] },
    { key: 'name', kind: 'text', label: 'نام موقعیت', required: true, validators: [Validators.minLength(2), Validators.maxLength(200)], colSpan: 2 },
    { key: 'description', kind: 'textarea', label: 'توضیحات', rows: 3, validators: [Validators.maxLength(1000)], colSpan: 2 },
    { key: 'locationTypeLookupValueId', kind: 'select', label: 'نوع موقعیت', options: options.locationTypeOptions },
    { key: 'parentLocationId', kind: 'select', label: 'موقعیت والد', options: options.parentLocationOptions },
    { key: 'active', kind: 'switch', label: 'فعال', initialValue: true }
  ];
}
