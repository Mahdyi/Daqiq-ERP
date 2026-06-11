import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { LoadingService } from '../loading/loading.service';
import { SKIP_GLOBAL_LOADING } from './http-context.tokens';

export const loadingInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.context.get(SKIP_GLOBAL_LOADING)) {
    return next(request);
  }

  return inject(LoadingService).track(next(request));
};
