import { InjectionToken } from '@angular/core';

import { AuthToken } from '../models/auth-state.model';

export type AuthStorageType = 'local' | 'session' | 'memory';

export interface AuthConfig {
  readonly loginRoute: string;
  readonly forbiddenRoute: string;
  readonly storageType: AuthStorageType;
}

export interface AuthTokenStorage {
  read(): AuthToken | null;
  write(token: AuthToken): void;
  remove(): void;
}

export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  loginRoute: '/auth/login',
  forbiddenRoute: '/forbidden',
  storageType: 'session'
};

export const AUTH_TOKEN_STORAGE_KEY = new InjectionToken<string>('AUTH_TOKEN_STORAGE_KEY', {
  providedIn: 'root',
  factory: () => 'daqiq-erp.auth-token'
});

export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_AUTH_CONFIG
});

export const AUTH_TOKEN_STORAGE = new InjectionToken<AuthTokenStorage>('AUTH_TOKEN_STORAGE');
