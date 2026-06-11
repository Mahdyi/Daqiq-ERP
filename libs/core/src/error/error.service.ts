import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';

import { AppError, AppErrorContext, AppErrorSeverity } from './app-error.model';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private readonly latestErrorState = signal<AppError | null>(null);

  readonly latestError = this.latestErrorState.asReadonly();
  readonly hasError = computed(() => this.latestError() !== null);

  capture(error: unknown, context?: AppErrorContext): AppError {
    const appError = this.normalize(error, context);
    this.latestErrorState.set(appError);

    return appError;
  }

  clear(): void {
    this.latestErrorState.set(null);
  }

  normalize(error: unknown, context?: AppErrorContext): AppError {
    if (this.isAppError(error)) {
      return {
        ...error,
        context: context ?? error.context
      };
    }

    if (error instanceof HttpErrorResponse) {
      return this.normalizeHttpError(error, context);
    }

    if (error instanceof Error) {
      return this.createError({
        message: error.message,
        severity: 'error',
        source: 'client',
        cause: error,
        context
      });
    }

    return this.createError({
      message: 'خطای غیرمنتظره رخ داد.',
      severity: 'error',
      source: 'unknown',
      details: error,
      context
    });
  }

  private normalizeHttpError(error: HttpErrorResponse, context?: AppErrorContext): AppError {
    const details = error.error as unknown;
    const backendMessage = this.readString(details, 'message');
    const backendCode = this.readString(details, 'code');
    const source = error.status === 0 ? 'network' : error.status >= 500 ? 'server' : 'http';

    return this.createError({
      message: backendMessage ?? error.message ?? 'خطا در ارتباط با سرور.',
      severity: this.getHttpSeverity(error.status),
      source,
      statusCode: error.status,
      code: backendCode,
      details,
      cause: error,
      context
    });
  }

  private createError(input: Omit<AppError, 'id' | 'timestamp'>): AppError {
    return {
      ...input,
      id: this.createErrorId(),
      timestamp: new Date().toISOString()
    };
  }

  private getHttpSeverity(statusCode: number): AppErrorSeverity {
    if (statusCode >= 500 || statusCode === 0) {
      return 'critical';
    }

    if (statusCode >= 400) {
      return 'error';
    }

    return 'warning';
  }

  private readString(value: unknown, key: string): string | undefined {
    if (!this.isRecord(value)) {
      return undefined;
    }

    const field = value[key];

    return typeof field === 'string' && field.trim().length > 0 ? field : undefined;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private isAppError(value: unknown): value is AppError {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value['id'] === 'string' &&
      typeof value['message'] === 'string' &&
      typeof value['timestamp'] === 'string'
    );
  }

  private createErrorId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `app-error-${Date.now()}`;
  }
}
