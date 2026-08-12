import { ApiError } from '@daqiq/core';

export function toReportError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError({
    status: 0,
    code: 'UNKNOWN',
    message: 'خطای غیرمنتظره در دریافت گزارش رخ داد.',
    fieldErrors: [],
    cause: error
  });
}
