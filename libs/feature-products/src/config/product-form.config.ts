import { Validators } from '@angular/forms';
import type { FormFieldConfig, FormFieldOption } from '@daqiq/ui';

import type { ProductFormValue } from '../models/product-form-value.model';
import { PRODUCT_TYPE_OPTIONS } from '../models/product-type.model';

export interface ProductLookupOptions {
  readonly categoryOptions: readonly FormFieldOption[];
  readonly unitOptions: readonly FormFieldOption[];
  readonly taxRateOptions: readonly FormFieldOption[];
}

export function createProductFormFields(
  options: ProductLookupOptions
): readonly FormFieldConfig<ProductFormValue>[] {
  return [
    {
      key: 'sku',
      kind: 'text',
      label: 'کد کالا',
      placeholder: 'مانند PRD-1001',
      required: true,
      validators: [Validators.minLength(2), Validators.maxLength(64)]
    },
    {
      key: 'name',
      kind: 'text',
      label: 'نام کالا',
      placeholder: 'نام کالا یا خدمت',
      required: true,
      validators: [Validators.minLength(2), Validators.maxLength(200)],
      colSpan: 2
    },
    {
      key: 'description',
      kind: 'textarea',
      label: 'توضیحات',
      rows: 3,
      validators: [Validators.maxLength(1000)],
      colSpan: 2
    },
    {
      key: 'barcode',
      kind: 'text',
      label: 'بارکد',
      validators: [Validators.maxLength(80)]
    },
    {
      key: 'productType',
      kind: 'select',
      label: 'نوع کالا',
      required: true,
      initialValue: 'finished_good',
      options: PRODUCT_TYPE_OPTIONS
    },
    {
      key: 'categoryLookupValueId',
      kind: 'select',
      label: 'دسته‌بندی',
      options: options.categoryOptions
    },
    {
      key: 'baseUnitLookupValueId',
      kind: 'select',
      label: 'واحد پایه',
      required: true,
      options: options.unitOptions
    },
    {
      key: 'taxRateLookupValueId',
      kind: 'select',
      label: 'نرخ مالیات',
      options: options.taxRateOptions
    },
    {
      key: 'trackInventory',
      kind: 'switch',
      label: 'کنترل موجودی',
      initialValue: true,
      visible: (value) => value.productType !== 'service',
      disabled: (value) => value.productType === 'service'
    },
    {
      key: 'purchasable',
      kind: 'switch',
      label: 'قابل خرید',
      initialValue: true
    },
    {
      key: 'sellable',
      kind: 'switch',
      label: 'قابل فروش',
      initialValue: true
    },
    {
      key: 'standardCost',
      kind: 'number',
      label: 'بهای استاندارد',
      validators: [Validators.min(0)]
    },
    {
      key: 'salesPrice',
      kind: 'number',
      label: 'قیمت فروش',
      validators: [Validators.min(0)]
    },
    {
      key: 'active',
      kind: 'switch',
      label: 'فعال',
      initialValue: true
    }
  ];
}
