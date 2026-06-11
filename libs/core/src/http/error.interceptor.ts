import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ErrorService } from '../error/error.service';
import { SKIP_GLOBAL_ERROR_HANDLER } from './http-context.tokens';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const errorService = inject(ErrorService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (request.context.get(SKIP_GLOBAL_ERROR_HANDLER)) {
        return throwError(() => error);
      }

      const appError = errorService.capture(error, {
        source: 'http',
        operation: request.urlWithParams
      });

      return throwError(() => appError);
    })
  );
};
