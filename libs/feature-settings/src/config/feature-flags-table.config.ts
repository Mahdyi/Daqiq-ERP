import type { DataTableColumn } from '@daqiq/ui';

import type { FeatureFlag } from '../models/feature-flag.model';

export const FEATURE_FLAGS_TABLE_COLUMNS: readonly DataTableColumn<FeatureFlag>[] = [
  {
    id: 'label',
    field: 'label',
    header: 'عنوان'
  },
  {
    id: 'flagKey',
    field: 'flagKey',
    header: 'کلید'
  },
  {
    id: 'category',
    field: 'category',
    header: 'دسته'
  },
  {
    id: 'enabled',
    field: 'enabled',
    header: 'وضعیت',
    formatter: (value) => (value === true ? 'فعال' : 'غیرفعال')
  }
];
