import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { provideCoreAuth } from './auth/auth.providers';
import { AppConfig } from './config/app-config.model';
import { provideAppConfig } from './config/app-config.providers';
import { provideCoreErrorHandling } from './error/error.providers';
import { ApiConfig } from './http/configuration/api-config.model';
import { provideCoreHttp } from './http/http.providers';

export function provideDaqiqCore(config: AppConfig): EnvironmentProviders {
  const apiConfig: ApiConfig = {
    baseUrl: config.apiBaseUrl
  };

  return makeEnvironmentProviders([
    provideCoreAuth(),
    provideAppConfig(config),
    provideCoreHttp(apiConfig),
    provideCoreErrorHandling()
  ]);
}
