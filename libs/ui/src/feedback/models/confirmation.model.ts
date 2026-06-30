export interface ConfirmationOptions {
  readonly header: string;
  readonly message: string;
  readonly acceptLabel?: string;
  readonly rejectLabel?: string;
  readonly icon?: string;
  readonly acceptButtonStyleClass?: string;
  readonly rejectButtonStyleClass?: string;
}
