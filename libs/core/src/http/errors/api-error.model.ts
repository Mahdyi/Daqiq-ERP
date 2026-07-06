export type ApiErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'SERVER'
  | 'UNKNOWN';

export interface ApiFieldError {
  readonly field: string;
  readonly messages: readonly string[];
}

export interface ApiErrorInput {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly traceId?: string;
  readonly backendCode?: string;
  readonly details?: string;
  readonly hint?: string;
  readonly fieldErrors?: readonly ApiFieldError[];
  readonly cause?: unknown;
}

export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly traceId?: string;
  readonly backendCode?: string;
  readonly details?: string;
  readonly hint?: string;
  readonly fieldErrors: readonly ApiFieldError[];
  override readonly cause?: unknown;

  constructor(input: ApiErrorInput) {
    super(input.message);

    this.status = input.status;
    this.code = input.code;
    this.traceId = input.traceId;
    this.backendCode = input.backendCode;
    this.details = input.details;
    this.hint = input.hint;
    this.fieldErrors = input.fieldErrors ?? [];
    this.cause = input.cause;
  }
}
