export type AppErrorSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AppErrorSource = 'http' | 'network' | 'client' | 'server' | 'unknown' | 'global';

export interface AppErrorContext {
  readonly source?: string;
  readonly operation?: string;
  readonly silent?: boolean;
}

export interface AppError {
  readonly id: string;
  readonly message: string;
  readonly severity: AppErrorSeverity;
  readonly source: AppErrorSource;
  readonly statusCode?: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly cause?: unknown;
  readonly context?: AppErrorContext;
  readonly timestamp: string;
}
