export type ApiErrorSource = 'http' | 'network' | 'client' | 'server' | 'unknown';

export interface ApiError {
  readonly message: string;
  readonly source: ApiErrorSource;
  readonly statusCode?: number;
  readonly code?: string;
  readonly details?: unknown;
}
