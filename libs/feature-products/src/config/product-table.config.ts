import type { DataTableColumn } from '@daqiq/ui';

import type { Product } from '../models/product.model';
import { formatProductType } from '../models/product-type.model';

export type LookupLabelResolver = (id: string | null) => string;

export function createProductTableColumns(
  lookupLabel: LookupLabelResolver
): readonly DataTableColumn<Product>[] {
  return [
    {
      id: 'sku',
      field: 'sku',
      header: 'کد کالا',
      sortable: true
    },
    {
      id: 'name',
      field: 'name',
      header: 'نام کالا',
      sortable: true
    },
    {
      id: 'productType',
      field: 'productType',
      header: 'نوع کالا',
      formatter: (_value, row) => formatProductType(row.productType)
    },
    {
      id: 'baseUnitLookupValueId',
      field: 'baseUnitLookupValueId',
      header: 'واحد پایه',
      formatter: (_value, row) => lookupLabel(row.baseUnitLookupValueId)
    },
    {
      id: 'categoryLookupValueId',
      field: 'categoryLookupValueId',
      header: 'دسته‌بندی',
      formatter: (_value, row) => lookupLabel(row.categoryLookupValueId)
    },
    {
      id: 'salesPrice',
      field: 'salesPrice',
      header: 'قیمت فروش',
      align: 'end',
      formatter: (_value, row) => formatMoney(row.salesPrice)
    },
    {
      id: 'active',
      field: 'active',
      header: 'وضعیت',
      formatter: (_value, row) => (row.active ? 'فعال' : 'غیرفعال')
    }
  ];
}

function formatMoney(value: number | null): string {
  return value === null
    ? '—'
    : new Intl.NumberFormat('fa-IR', {
        maximumFractionDigits: 2
      }).format(value);
}
