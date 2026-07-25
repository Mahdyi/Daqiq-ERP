import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { AuthSession } from '../models/auth-state.model';
import { AUTH_TOKEN_STORAGE, AuthTokenStorage } from '../tokens/auth.tokens';

class MemoryTokenStorage implements AuthTokenStorage {
  session: AuthSession | null = null;
  readonly writeSpy = jasmine.createSpy('write');
  readonly removeSpy = jasmine.createSpy('remove');

  read(): AuthSession | null {
    return this.session;
  }

  write(session: AuthSession): void {
    this.writeSpy(session);
    this.session = session;
  }

  remove(): void {
    this.removeSpy();
    this.session = null;
  }
}

describe('AuthService session expiry', () => {
  function createSession(expiresAt: string, refreshToken?: string): AuthSession {
    return {
      user: {
        id: '1',
        username: 'admin@erp.com',
        displayName: 'Admin',
        email: 'admin@erp.com',
        roles: []
      },
      token: {
        accessToken: 'opaque-test-access-value',
        refreshToken,
        tokenType: 'Bearer',
        expiresAt
      }
    };
  }

  function setup(storedSession: AuthSession | null = null): {
    readonly service: AuthService;
    readonly storage: MemoryTokenStorage;
  } {
    const storage = new MemoryTokenStorage();
    storage.session = storedSession;

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: AUTH_TOKEN_STORAGE,
          useValue: storage
        }
      ]
    });

    return {
      service: TestBed.inject(AuthService),
      storage
    };
  }

  it('clears expired stored tokens during startup', () => {
    const { service, storage } = setup(createSession('2000-01-01T00:00:00.000Z'));

    expect(service.token()).toBeNull();
    expect(service.status()).toBe('unauthenticated');
    expect(storage.removeSpy).toHaveBeenCalled();
  });

  it('restores expired access sessions when a refresh token exists', () => {
    const { service, storage } = setup(
      createSession('2000-01-01T00:00:00.000Z', 'opaque-refresh-value')
    );

    expect(service.user()?.email).toBe('admin@erp.com');
    expect(service.token()?.refreshToken).toBe('opaque-refresh-value');
    expect(service.hasRefreshToken()).toBeTrue();
    expect(service.isAuthenticated()).toBeFalse();
    expect(storage.removeSpy).not.toHaveBeenCalled();
  });

  it('treats expired login sessions as unauthenticated', () => {
    const { service } = setup();

    service.login({
      user: {
        id: '1',
        username: 'admin@erp.com',
        displayName: 'Admin',
        email: 'admin@erp.com',
        roles: []
      },
      token: {
        accessToken: 'expired-access-value',
        tokenType: 'Bearer',
        expiresAt: '2000-01-01T00:00:00.000Z'
      }
    });

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.token()).toBeNull();
  });
});
