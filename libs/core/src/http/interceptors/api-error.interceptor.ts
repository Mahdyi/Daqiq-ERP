import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { mapApiError } from '../errors/api-error.mapper';
import { isApiError } from '../errors/api-error.util';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (isApiError(error)) {
        return throwError(() => error);
      }

      return throwError(() => mapApiError(error));
    })
  );
