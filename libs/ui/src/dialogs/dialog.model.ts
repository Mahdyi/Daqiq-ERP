export interface UiNotificationRequest {
  readonly title?: string;
  readonly message: string;
  readonly life?: number;
  readonly sticky?: boolean;
}

export interface UiConfirmationRequest {
  readonly message: string;
  readonly title?: string;
  readonly icon?: string;
  readonly acceptLabel?: string;
  readonly rejectLabel?: string;
  readonly accept?: () => void;
  readonly reject?: () => void;
}
