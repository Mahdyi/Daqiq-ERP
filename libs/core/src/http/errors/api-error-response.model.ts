import { ApiErrorCode, ApiFieldError } from './api-error.model';

export interface ApiErrorResponse {
  readonly code?: ApiErrorCode | string;
  readonly message?: string;
  readonly traceId?: string;
  readonly fieldErrors?: readonly ApiFieldError[];
  readonly errors?: Readonly<Record<string, string | readonly string[]>>;
}
