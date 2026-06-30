export type FormScalarValue = string | number | boolean | Date | null;

export interface FormFieldOption<TValue extends string | number = string> {
  readonly label: string;
  readonly value: TValue;
  readonly disabled?: boolean;
}
