import type { SystemSettingValue, SystemSettingValueType } from '../models/system-setting.model';

export interface SystemSettingResponseDto {
  readonly id: string;
  readonly settingKey: string;
  readonly settingValue: SystemSettingValue;
  readonly valueType: SystemSettingValueType;
  readonly category: string;
  readonly label: string;
  readonly description: string | null;
  readonly editable: boolean;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
