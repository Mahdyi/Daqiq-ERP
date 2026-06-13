import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { BrowserAuthTokenStorage } from './services/auth-token-storage.service';
import {
  AUTH_CONFIG,
  AUTH_TOKEN_STORAGE,
  AuthConfig,
  DEFAULT_AUTH_CONFIG
} from './tokens/auth.tokens';

export function provideCoreAuth(config: Partial<AuthConfig> = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: AUTH_CONFIG,
      useValue: {
        ...DEFAULT_AUTH_CONFIG,
        ...config
      }
    },
    BrowserAuthTokenStorage,
    {
      provide: AUTH_TOKEN_STORAGE,
      useExisting: BrowserAuthTokenStorage
    }
  ]);
}
