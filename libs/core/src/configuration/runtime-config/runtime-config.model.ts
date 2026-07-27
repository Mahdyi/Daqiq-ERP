export type RuntimeSettingValue =
  | string
  | number
  | boolean
  | null
  | readonly unknown[]
  | Readonly<Record<string, unknown>>;

export type RuntimeSettingValueType = 'string' | 'number' | 'boolean' | 'json';

export interface RuntimeSystemSetting {
  readonly id: string;
  readonly settingKey: string;
  readonly settingValue: RuntimeSettingValue;
  readonly valueType: RuntimeSettingValueType;
  readonly category: string;
  readonly label: string;
  readonly description: string | null;
  readonly editable: boolean;
  readonly active: boolean;
}

export interface RuntimeLookupValue {
  readonly id: string;
  readonly lookupTypeCode: string;
  readonly code: string;
  readonly label: string;
  readonly description: string | null;
  readonly sortOrder: number;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly system: boolean;
  readonly active: boolean;
}

export interface RuntimeFeatureFlag {
  readonly id: string;
  readonly flagKey: string;
  readonly enabled: boolean;
  readonly label: string;
  readonly description: string | null;
  readonly category: string;
}
