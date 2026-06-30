import { HttpInterceptorFn } from '@angular/common/http';

import { SKIP_CORRELATION_ID } from '../tokens/http-context.tokens';

const REQUEST_ID_HEADER = 'X-Request-Id';

export const correlationIdInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.context.get(SKIP_CORRELATION_ID) || request.headers.has(REQUEST_ID_HEADER)) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        [REQUEST_ID_HEADER]: createRequestId()
      }
    })
  );
};

function createRequestId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  );
}
