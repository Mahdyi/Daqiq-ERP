import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

import { AuthSession } from '../models/auth-state.model';
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

  read(): AuthSession | null {
    const serializedSession = this.readSerializedSession();

    if (!serializedSession) {
      return null;
    }

    try {
      const parsedSession: unknown = JSON.parse(serializedSession);

      return this.isAuthSession(parsedSession) ? parsedSession : null;
    } catch {
      this.remove();
      return null;
    }
  }

  write(session: AuthSession): void {
    const serializedSession = JSON.stringify(session);
    const storage = this.getBrowserStorage();

    if (storage) {
      try {
        storage.setItem(this.storageKey, serializedSession);
        return;
      } catch {
        this.memoryStorage.set(this.storageKey, serializedSession);
        return;
      }
    }

    this.memoryStorage.set(this.storageKey, serializedSession);
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

  private readSerializedSession(): string | null {
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

  private isAuthSession(value: unknown): value is AuthSession {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const session = value as Record<string, unknown>;
    const token = session['token'];
    const user = session['user'];

    if (typeof token !== 'object' || token === null || typeof user !== 'object' || user === null) {
      return false;
    }

    const tokenRecord = token as Record<string, unknown>;
    const userRecord = user as Record<string, unknown>;

    return (
      typeof tokenRecord['accessToken'] === 'string' &&
      tokenRecord['accessToken'].length > 0 &&
      typeof userRecord['id'] === 'string' &&
      typeof userRecord['username'] === 'string' &&
      typeof userRecord['displayName'] === 'string' &&
      Array.isArray(userRecord['roles'])
    );
  }
}
