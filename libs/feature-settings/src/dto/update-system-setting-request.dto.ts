import type { SystemSettingValue } from '../models/system-setting.model';

export interface UpdateSystemSettingRequest {
  readonly settingKey: string;
  readonly settingValue: SystemSettingValue;
}

export interface UpdateSystemSettingRpcRequestDto {
  readonly setting_key: string;
  readonly setting_value: SystemSettingValue;
}
