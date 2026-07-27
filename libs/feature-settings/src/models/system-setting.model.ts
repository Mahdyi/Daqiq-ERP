export type SystemSettingValueType = 'string' | 'number' | 'boolean' | 'json';

export type SystemSettingValue =
  | string
  | number
  | boolean
  | null
  | readonly unknown[]
  | Readonly<Record<string, unknown>>;

export interface SystemSetting {
  readonly id: string;
  readonly settingKey: string;
  readonly settingValue: SystemSettingValue;
  readonly valueType: SystemSettingValueType;
  readonly category: string;
  readonly label: string;
  readonly description: string | null;
  readonly editable: boolean;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
