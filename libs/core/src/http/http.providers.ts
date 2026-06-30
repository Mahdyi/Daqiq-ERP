import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { errorInterceptor } from './error.interceptor';

export function provideCoreHttp(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(withInterceptors([errorInterceptor]))
  ]);
}
