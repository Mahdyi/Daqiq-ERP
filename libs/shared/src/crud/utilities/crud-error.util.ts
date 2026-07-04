import { ApiError } from '@daqiq/core';

export function normalizeCrudError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError({
    status: 0,
    code: 'UNKNOWN',
    message: 'خطای غیرمنتظره رخ داد.',
    fieldErrors: [],
    cause: error
  });
}
