export interface FormLayoutConfig {
  readonly columns?: 1 | 2 | 3 | 4;
  readonly submitLabel?: string;
  readonly cancelLabel?: string;
  readonly showCancel?: boolean;
}

export const DEFAULT_FORM_LAYOUT: Required<FormLayoutConfig> = {
  columns: 1,
  submitLabel: 'ثبت',
  cancelLabel: 'انصراف',
  showCancel: false
};
