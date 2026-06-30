export type NotificationSeverity = 'success' | 'info' | 'warn' | 'error';

export interface NotificationOptions {
  readonly severity: NotificationSeverity;
  readonly summary: string;
  readonly detail?: string;
  readonly life?: number;
  readonly sticky?: boolean;
}
