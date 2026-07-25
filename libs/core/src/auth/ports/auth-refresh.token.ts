import { InjectionToken } from '@angular/core';

import { AuthRefreshPort } from './auth-refresh.port';

export const AUTH_REFRESH_PORT = new InjectionToken<AuthRefreshPort | null>(
  'AUTH_REFRESH_PORT',
  {
    providedIn: 'root',
    factory: () => null
  }
);
