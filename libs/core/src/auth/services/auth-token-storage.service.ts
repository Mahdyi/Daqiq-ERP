import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

import { AuthToken } from '../models/auth-state.model';
import {
  AUTH_CONFIG,
  AUTH_TOKEN_STORAGE_KEY,
  AuthTokenStorage
} from '../tokens/auth.tokens';

@Injectable({
  providedIn: 'root'
})
export class BrowserAuthTokenStorage implements AuthTokenStorage {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly config = inject(AUTH_CONFIG);
  private readonly storageKey = inject(AUTH_TOKEN_STORAGE_KEY);
  private readonly memoryStorage = new Map<string, string>();
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  read(): AuthToken | null {
    const serializedToken = this.readSerializedToken();

    if (!serializedToken) {
      return null;
    }

    try {
      const parsedToken: unknown = JSON.parse(serializedToken);

      return this.isAuthToken(parsedToken) ? parsedToken : null;
    } catch {
      this.remove();
      return null;
    }
  }

  write(token: AuthToken): void {
    const serializedToken = JSON.stringify(token);
    const storage = this.getBrowserStorage();

    if (storage) {
      try {
        storage.setItem(this.storageKey, serializedToken);
        return;
      } catch {
        this.memoryStorage.set(this.storageKey, serializedToken);
        return;
      }
    }

    this.memoryStorage.set(this.storageKey, serializedToken);
  }

  remove(): void {
    const storage = this.getBrowserStorage();

    if (storage) {
      try {
        storage.removeItem(this.storageKey);
      } catch {
        // The in-memory fallback is still cleared below.
      }
    }

    this.memoryStorage.delete(this.storageKey);
  }

  private readSerializedToken(): string | null {
    const storage = this.getBrowserStorage();

    if (storage) {
      try {
        return storage.getItem(this.storageKey);
      } catch {
        return this.memoryStorage.get(this.storageKey) ?? null;
      }
    }

    return this.memoryStorage.get(this.storageKey) ?? null;
  }

  private getBrowserStorage(): Storage | null {
    if (!this.isBrowser || this.config.storageType === 'memory') {
      return null;
    }

    const window = this.document.defaultView;

    if (!window) {
      return null;
    }

    try {
      return this.config.storageType === 'session' ? window.sessionStorage : window.localStorage;
    } catch {
      return null;
    }
  }

  private isAuthToken(value: unknown): value is AuthToken {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const token = value as Record<string, unknown>;

    return typeof token['accessToken'] === 'string' && token['accessToken'].length > 0;
  }
}
