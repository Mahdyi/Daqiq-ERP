import { ApiError } from '@daqiq/core';

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError({
    status: 0,
    code: 'UNKNOWN',
    message: 'خطای غیرمنتظره رخ داد.',
    cause: error,
    fieldErrors: []
  });
}
