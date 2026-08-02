import { Validators } from '@angular/forms';
import type { FormFieldConfig, FormFieldOption } from '@daqiq/ui';
import type { WarehouseFormValue } from '../models/warehouse-form-value.model';

export function createWarehouseFormFields(
  warehouseTypeOptions: readonly FormFieldOption[]
): readonly FormFieldConfig<WarehouseFormValue>[] {
  return [
    { key: 'code', kind: 'text', label: 'کد انبار', required: true, validators: [Validators.minLength(2), Validators.maxLength(64)] },
    { key: 'name', kind: 'text', label: 'نام انبار', required: true, validators: [Validators.minLength(2), Validators.maxLength(200)], colSpan: 2 },
    { key: 'description', kind: 'textarea', label: 'توضیحات', rows: 3, validators: [Validators.maxLength(1000)], colSpan: 2 },
    { key: 'warehouseTypeLookupValueId', kind: 'select', label: 'نوع انبار', options: warehouseTypeOptions },
    { key: 'address', kind: 'textarea', label: 'آدرس', rows: 3, validators: [Validators.maxLength(1000)], colSpan: 2 },
    { key: 'responsiblePerson', kind: 'text', label: 'مسئول انبار', validators: [Validators.maxLength(160)] },
    { key: 'phone', kind: 'text', label: 'شماره تماس', validators: [Validators.maxLength(80)] },
    { key: 'email', kind: 'email', label: 'ایمیل', validators: [Validators.email, Validators.maxLength(320)] },
    { key: 'active', kind: 'switch', label: 'فعال', initialValue: true }
  ];
}
