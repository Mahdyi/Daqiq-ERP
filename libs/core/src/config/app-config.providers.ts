import { Provider } from '@angular/core';

import { AppConfig } from './app-config.model';
import { APP_CONFIG } from './app-config.tokens';

export function provideAppConfig(config: AppConfig): Provider {
  return {
    provide: APP_CONFIG,
    useValue: config
  };
}
