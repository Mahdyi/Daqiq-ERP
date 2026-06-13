export type FormFieldType = 'text' | 'number' | 'select' | 'date';

export type FormFieldInputValue = string | number | null;

export type FormFieldKey<TModel extends object> = Extract<keyof TModel, string>;

export interface FormFieldValueChange<TModel extends object> {
  readonly field: FormFieldKey<TModel>;
  readonly value: FormFieldInputValue;
}
