import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { errorInterceptor } from './error.interceptor';
import { loadingInterceptor } from './loading.interceptor';

export function provideCoreHttp(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(withInterceptors([loadingInterceptor, errorInterceptor]))
  ]);
}
