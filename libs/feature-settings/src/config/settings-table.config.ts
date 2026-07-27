import type { DataTableColumn } from '@daqiq/ui';

import type { SystemSetting, SystemSettingValue } from '../models/system-setting.model';

export const SETTINGS_TABLE_COLUMNS: readonly DataTableColumn<SystemSetting>[] = [
  {
    id: 'label',
    field: 'label',
    header: 'عنوان'
  },
  {
    id: 'settingKey',
    field: 'settingKey',
    header: 'کلید'
  },
  {
    id: 'category',
    field: 'category',
    header: 'دسته'
  },
  {
    id: 'valueType',
    field: 'valueType',
    header: 'نوع'
  },
  {
    id: 'settingValue',
    valueAccessor: (setting) => formatSettingValue(setting.settingValue),
    header: 'مقدار'
  },
  {
    id: 'editable',
    field: 'editable',
    header: 'قابل ویرایش',
    formatter: (value) => (value === true ? 'بله' : 'خیر')
  }
];

export function formatSettingValue(value: SystemSettingValue): string {
  if (value === null) {
    return '';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}
