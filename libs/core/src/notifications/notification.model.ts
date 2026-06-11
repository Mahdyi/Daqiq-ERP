export type NotificationSeverity = 'success' | 'info' | 'warn' | 'error';

export interface NotificationOptions {
  readonly summary?: string;
  readonly detail: string;
  readonly key?: string;
  readonly life?: number;
  readonly sticky?: boolean;
  readonly closable?: boolean;
}

export interface ConfirmationOptions {
  readonly message: string;
  readonly header?: string;
  readonly icon?: string;
  readonly key?: string;
  readonly acceptLabel?: string;
  readonly rejectLabel?: string;
  readonly acceptButtonStyleClass?: string;
  readonly rejectButtonStyleClass?: string;
  readonly accept?: () => void;
  readonly reject?: () => void;
}
