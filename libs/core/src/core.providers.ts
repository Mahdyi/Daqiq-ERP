import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { provideCoreAuth } from './auth/auth.providers';
import { AppConfig } from './config/app-config.model';
import { provideAppConfig } from './config/app-config.providers';
import { provideCoreErrorHandling } from './error/error.providers';
import { provideCoreHttp } from './http/http.providers';
import { provideCoreNotifications } from './notifications/notification.providers';

export function provideDaqiqCore(config: AppConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideCoreAuth(),
    provideAppConfig(config),
    provideCoreHttp(),
    provideCoreErrorHandling(),
    provideCoreNotifications()
  ]);
}
