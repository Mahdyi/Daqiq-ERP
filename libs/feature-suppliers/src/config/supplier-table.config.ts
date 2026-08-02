import type { DataTableColumn } from '@daqiq/ui';

import type { Supplier } from '../models/supplier.model';

export type LookupLabelResolver = (id: string | null) => string;

export function createSupplierTableColumns(
  lookupLabel: LookupLabelResolver
): readonly DataTableColumn<Supplier>[] {
  return [
    {
      id: 'code',
      field: 'code',
      header: 'کد تأمین‌کننده',
      sortable: true
    },
    {
      id: 'name',
      field: 'name',
      header: 'نام تأمین‌کننده',
      sortable: true
    },
    {
      id: 'supplierGroupLookupValueId',
      field: 'supplierGroupLookupValueId',
      header: 'گروه',
      formatter: (_value, row) => lookupLabel(row.supplierGroupLookupValueId)
    },
    {
      id: 'currencyLookupValueId',
      field: 'currencyLookupValueId',
      header: 'ارز',
      formatter: (_value, row) => lookupLabel(row.currencyLookupValueId)
    },
    {
      id: 'email',
      field: 'email',
      header: 'ایمیل',
      formatter: (_value, row) => row.email ?? '—'
    },
    {
      id: 'phone',
      field: 'phone',
      header: 'شماره تماس',
      formatter: (_value, row) => row.phone ?? '—'
    },
    {
      id: 'active',
      field: 'active',
      header: 'وضعیت',
      formatter: (_value, row) => (row.active ? 'فعال' : 'غیرفعال')
    }
  ];
}
