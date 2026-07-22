import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { AuthToken } from '../models/auth-state.model';
import { AUTH_TOKEN_STORAGE, AuthTokenStorage } from '../tokens/auth.tokens';

class MemoryTokenStorage implements AuthTokenStorage {
  token: AuthToken | null = null;
  readonly writeSpy = jasmine.createSpy('write');
  readonly removeSpy = jasmine.createSpy('remove');

  read(): AuthToken | null {
    return this.token;
  }

  write(token: AuthToken): void {
    this.writeSpy(token);
    this.token = token;
  }

  remove(): void {
    this.removeSpy();
    this.token = null;
  }
}

describe('AuthService session expiry', () => {
  function setup(storedToken: AuthToken | null = null): {
    readonly service: AuthService;
    readonly storage: MemoryTokenStorage;
  } {
    const storage = new MemoryTokenStorage();
    storage.token = storedToken;

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
    const { service, storage } = setup({
      accessToken: 'expired-access-value',
      tokenType: 'Bearer',
      expiresAt: '2000-01-01T00:00:00.000Z'
    });

    expect(service.token()).toBeNull();
    expect(service.status()).toBe('unauthenticated');
    expect(storage.removeSpy).toHaveBeenCalled();
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
