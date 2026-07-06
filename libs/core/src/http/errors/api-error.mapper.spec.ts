import { HttpErrorResponse } from '@angular/common/http';

import { mapApiError } from './api-error.mapper';

describe('mapApiError', () => {
  it('maps status 0 to a network error', () => {
    const error = mapApiError(new HttpErrorResponse({ status: 0 }));

    expect(error.name).toBe('ApiError');
    expect(error.code).toBe('NETWORK');
  });

  it('maps status 403 to forbidden with trace id', () => {
    const error = mapApiError(
      new HttpErrorResponse({
        status: 403,
        error: {
          message: 'دسترسی مجاز نیست',
          traceId: 'trace-1'
        }
      })
    );

    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toBe('دسترسی مجاز نیست');
    expect(error.traceId).toBe('trace-1');
  });

  it('extracts field errors from backend validation payloads', () => {
    const error = mapApiError(
      new HttpErrorResponse({
        status: 422,
        error: {
          fieldErrors: [
            {
              field: 'email',
              messages: ['ایمیل معتبر نیست']
            }
          ]
        }
      })
    );

    expect(error.code).toBe('VALIDATION');
    expect(error.fieldErrors).toEqual([
      {
        field: 'email',
        messages: ['ایمیل معتبر نیست']
      }
    ]);
  });

  it('preserves PostgREST diagnostic fields without changing status classification', () => {
    const error = mapApiError(
      new HttpErrorResponse({
        status: 409,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint',
          details: 'Key already exists.',
          hint: 'Use a different customer code.'
        }
      })
    );

    expect(error.code).toBe('CONFLICT');
    expect(error.backendCode).toBe('23505');
    expect(error.details).toBe('Key already exists.');
    expect(error.hint).toBe('Use a different customer code.');
  });
});
