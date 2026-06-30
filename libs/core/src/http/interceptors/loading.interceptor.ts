import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';

import { HTTP_ACTIVITY_PORT } from '../ports/http-activity.token';
import { SKIP_HTTP_LOADING } from '../tokens/http-context.tokens';

export const loadingInterceptor: HttpInterceptorFn = (request, next) => {
  const activityPort = inject(HTTP_ACTIVITY_PORT);

  if (request.context.get(SKIP_HTTP_LOADING) || activityPort === null) {
    return next(request);
  }

  const handle = activityPort.begin();

  return next(request).pipe(finalize(() => handle.close()));
};
