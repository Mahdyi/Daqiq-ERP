import { Observable } from 'rxjs';

export interface AppDialogOptions<TData> {
  readonly header: string;
  readonly data?: TData;
  readonly width?: string;
  readonly modal?: boolean;
  readonly closable?: boolean;
  readonly dismissableMask?: boolean;
  readonly styleClass?: string;
}

export interface AppDialogRef<TResult> {
  readonly closed: Observable<TResult | undefined>;
  close(result?: TResult): void;
}
