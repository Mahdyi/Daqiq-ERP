import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthToken } from '../models/auth-state.model';
import { AuthRefreshPort } from '../ports/auth-refresh.port';
import { AUTH_REFRESH_PORT } from '../ports/auth-refresh.token';
import { AuthService } from './auth.service';
import { AuthRefreshService } from './auth-refresh.service';

describe('AuthRefreshService', () => {
  function setup(port: AuthRefreshPort): {
    readonly service: AuthRefreshService;
    readonly tokenState: WritableSignal<AuthToken | null>;
    readonly updateToken: jasmine.Spy;
    readonly logout: jasmine.Spy;
  } {
    const tokenState = signal<AuthToken | null>({
      accessToken: 'expired-access-value',
      refreshToken: 'opaque-refresh-value',
      expiresAt: '2000-01-01T00:00:00.000Z'
    });
    const updateToken = jasmine.createSpy('updateToken').and.callFake((token: AuthToken) => {
      tokenState.set(token);
      return true;
    });
    const logout = jasmine.createSpy('logout');

    TestBed.configureTestingModule({
      providers: [
        AuthRefreshService,
        {
          provide: AUTH_REFRESH_PORT,
          useValue: port
        },
        {
          provide: AuthService,
          useValue: {
            token: tokenState.asReadonly(),
            isTokenExpired: (token: AuthToken | null) =>
              token?.expiresAt ? Date.parse(token.expiresAt) <= Date.now() : false,
            updateToken,
            logout
          }
        }
      ]
    });

    return {
      service: TestBed.inject(AuthRefreshService),
      tokenState,
      updateToken,
      logout
    };
  }

  it('refreshes an expired token through the configured port', async () => {
    const refresh = jasmine.createSpy('refresh').and.resolveTo({
      accessToken: 'new-access-value',
      refreshToken: 'new-refresh-value',
      tokenType: 'Bearer',
      expiresAt: '2099-01-01T00:00:00.000Z'
    });
    const { service, updateToken } = setup({ refresh });

    const result = await service.refreshIfNeeded();

    expect(result).toBeTrue();
    expect(refresh).toHaveBeenCalledOnceWith('opaque-refresh-value');
    expect(updateToken).toHaveBeenCalledWith({
      accessToken: 'new-access-value',
      refreshToken: 'new-refresh-value',
      tokenType: 'Bearer',
      expiresAt: '2099-01-01T00:00:00.000Z'
    });
  });

  it('clears the local session when refresh fails', async () => {
    const refresh = jasmine.createSpy('refresh').and.rejectWith(new Error('failed'));
    const { service, logout } = setup({ refresh });

    const result = await service.refreshIfNeeded();

    expect(result).toBeFalse();
    expect(logout).toHaveBeenCalled();
  });
});
