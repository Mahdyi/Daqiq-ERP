export interface FormSubmitEvent<TFormValue> {
  readonly value: Readonly<TFormValue>;
  readonly valid: boolean;
}
