import { FormFieldInputValue, FormFieldKey, FormFieldType } from './form-engine.types';

export interface FormFieldOption {
  readonly label: string;
  readonly value: FormFieldInputValue;
  readonly disabled?: boolean;
}

export interface FormFieldConfig<TModel extends object> {
  readonly key: FormFieldKey<TModel>;
  readonly type: FormFieldType;
  readonly label: string;
  readonly placeholder?: string;
  readonly description?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly options?: readonly FormFieldOption[];
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly columnSpan?: 1 | 2;
}

export interface FormEngineConfig<TModel extends object> {
  readonly fields: readonly FormFieldConfig<TModel>[];
  readonly columns?: 1 | 2;
}
