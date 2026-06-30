import { HttpErrorResponse } from '@angular/common/http';

import { ApiError, ApiErrorCode, ApiFieldError } from './api-error.model';
import {
  isApiError,
  isRecord,
  readString,
  readStringArray
} from './api-error.util';

const FALLBACK_MESSAGES = {
  NETWORK: 'خطا در ارتباط با سرور',
  TIMEOUT: 'زمان پاسخ‌گویی سرور به پایان رسید',
  UNAUTHORIZED: 'برای ادامه باید وارد سامانه شوید',
  FORBIDDEN: 'دسترسی مجاز نیست',
  NOT_FOUND: 'منبع موردنظر یافت نشد',
  VALIDATION: 'اطلاعات ارسالی معتبر نیست',
  CONFLICT: 'درخواست با وضعیت فعلی سامانه ناسازگار است',
  RATE_LIMITED: 'تعداد درخواست‌ها بیش از حد مجاز است',
  SERVER: 'خطا در ارتباط با سرور',
  UNKNOWN: 'خطای غیرمنتظره رخ داد'
} satisfies Record<ApiErrorCode, string>;

export function mapApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof HttpErrorResponse) {
    return mapHttpErrorResponse(error);
  }

  const code = isTimeoutError(error) ? 'TIMEOUT' : 'UNKNOWN';

  return new ApiError({
    status: 0,
    code,
    message: readErrorMessage(error) ?? FALLBACK_MESSAGES[code],
    fieldErrors: [],
    cause: error
  });
}

function mapHttpErrorResponse(error: HttpErrorResponse): ApiError {
  const code = resolveErrorCode(error);
  const backendPayload = error.error as unknown;
  const traceId = readTraceId(error, backendPayload);
  const fieldErrors = readFieldErrors(backendPayload);
  const backendMessage = readString(backendPayload, 'message');

  return new ApiError({
    status: error.status,
    code,
    message: backendMessage ?? FALLBACK_MESSAGES[code],
    traceId,
    fieldErrors,
    cause: error
  });
}

function resolveErrorCode(error: HttpErrorResponse): ApiErrorCode {
  if (isTimeoutError(error.error) || isTimeoutError(error)) {
    return 'TIMEOUT';
  }

  switch (error.status) {
    case 0:
      return 'NETWORK';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION';
    case 429:
      return 'RATE_LIMITED';
    default:
      return error.status >= 500 && error.status <= 599 ? 'SERVER' : 'UNKNOWN';
  }
}

function readTraceId(error: HttpErrorResponse, payload: unknown): string | undefined {
  return (
    readString(payload, 'traceId') ??
    readString(payload, 'traceID') ??
    error.headers.get('X-Trace-Id') ??
    error.headers.get('trace-id') ??
    undefined
  );
}

function readFieldErrors(payload: unknown): readonly ApiFieldError[] {
  if (!isRecord(payload)) {
    return [];
  }

  const directFieldErrors = payload['fieldErrors'];
  const parsedDirectFieldErrors = parseFieldErrorArray(directFieldErrors);

  if (parsedDirectFieldErrors.length > 0) {
    return parsedDirectFieldErrors;
  }

  const errors = payload['errors'];

  if (!isRecord(errors)) {
    return [];
  }

  return Object.entries(errors).flatMap(([field, value]) => {
    const messages = typeof value === 'string' ? [value] : readStringArray(value);

    return messages.length > 0 ? [{ field, messages }] : [];
  });
}

function parseFieldErrorArray(value: unknown): readonly ApiFieldError[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const field = readString(entry, 'field');
    const messagesValue = entry['messages'];
    const messages =
      typeof messagesValue === 'string' ? [messagesValue] : readStringArray(messagesValue);

    return field && messages.length > 0 ? [{ field, messages }] : [];
  });
}

function isTimeoutError(error: unknown): boolean {
  if (!isRecord(error)) {
    return false;
  }

  return (
    error['name'] === 'TimeoutError' ||
    (typeof error['message'] === 'string' &&
      error['message'].toLowerCase().includes('timeout'))
  );
}

function readErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return readString(error, 'message');
}
