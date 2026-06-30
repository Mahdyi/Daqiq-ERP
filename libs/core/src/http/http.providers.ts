import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { ApiConfig } from './configuration/api-config.model';
import { API_CONFIG } from './configuration/api-config.token';
import { apiErrorInterceptor } from './interceptors/api-error.interceptor';
import { correlationIdInterceptor } from './interceptors/correlation-id.interceptor';
import { loadingInterceptor } from './interceptors/loading.interceptor';

export function provideCoreHttp(config: ApiConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: API_CONFIG,
      useValue: config
    },
    provideHttpClient(
      withInterceptors([
        correlationIdInterceptor,
        loadingInterceptor,
        apiErrorInterceptor
      ])
    )
  ]);
}
