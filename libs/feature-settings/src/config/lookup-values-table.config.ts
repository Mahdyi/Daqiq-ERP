import type { DataTableColumn } from '@daqiq/ui';

import type { LookupValue } from '../models/lookup-value.model';

export const LOOKUP_VALUES_TABLE_COLUMNS: readonly DataTableColumn<LookupValue>[] = [
  {
    id: 'label',
    field: 'label',
    header: 'عنوان'
  },
  {
    id: 'code',
    field: 'code',
    header: 'کد'
  },
  {
    id: 'sortOrder',
    field: 'sortOrder',
    header: 'ترتیب',
    align: 'center'
  },
  {
    id: 'system',
    field: 'system',
    header: 'سیستمی',
    formatter: (value) => (value === true ? 'بله' : 'خیر')
  },
  {
    id: 'active',
    field: 'active',
    header: 'وضعیت',
    formatter: (value) => (value === true ? 'فعال' : 'غیرفعال')
  }
];
