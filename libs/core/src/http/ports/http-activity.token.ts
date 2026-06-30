import { InjectionToken } from '@angular/core';

import { HttpActivityPort } from './http-activity.port';

export const HTTP_ACTIVITY_PORT = new InjectionToken<HttpActivityPort | null>(
  'HTTP_ACTIVITY_PORT',
  {
    providedIn: 'root',
    factory: () => null
  }
);
