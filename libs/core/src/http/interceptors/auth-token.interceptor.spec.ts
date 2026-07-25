import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '../../auth/services/auth.service';
import { API_CONFIG } from '../configuration/api-config.token';
import { SKIP_AUTH_TOKEN } from '../tokens/http-context.tokens';
import { authTokenInterceptor } from './auth-token.interceptor';

describe('authTokenInterceptor', () => {
  function setup(accessToken: string | null, expiresAt?: string, refreshToken?: string): {
    readonly httpClient: HttpClient;
    readonly http: HttpTestingController;
    readonly clearExpiredSession: jasmine.Spy;
  } {
    const tokenSignal = signal(accessToken ? { accessToken, expiresAt, refreshToken } : null);
    const clearExpiredSession = jasmine.createSpy('clearExpiredSession');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authTokenInterceptor])),
        provideHttpClientTesting(),
        {
          provide: API_CONFIG,
          useValue: {
            baseUrl: '/api'
          }
        },
        {
          provide: AuthService,
          useValue: {
            token: tokenSignal.asReadonly(),
            isTokenExpired: (token: { readonly expiresAt?: string } | null) =>
              token?.expiresAt ? Date.parse(token.expiresAt) <= Date.now() : false,
            clearExpiredSession
          }
        }
      ]
    });

    return {
      httpClient: TestBed.inject(HttpClient),
      http: TestBed.inject(HttpTestingController),
      clearExpiredSession
    };
  }

  it('attaches a valid session access value to API requests', () => {
    const { httpClient, http } = setup('opaque-test-access-value');

    httpClient.get('/api/customers').subscribe();

    const request = http.expectOne('/api/customers');
    expect(request.request.headers.get('Authorization')).toBe('Bearer opaque-test-access-value');
    request.flush([]);
    http.verify();
  });

  it('respects SKIP_AUTH_TOKEN', () => {
    const { httpClient, http } = setup('opaque-test-access-value');

    httpClient.get('/api/customers', {
      context: new HttpContext().set(SKIP_AUTH_TOKEN, true)
    }).subscribe();

    const request = http.expectOne('/api/customers');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush([]);
    http.verify();
  });

  it('does not attach tokens to unrelated URLs', () => {
    const { httpClient, http } = setup('opaque-test-access-value');

    httpClient.get('https://example.com/metrics').subscribe();

    const request = http.expectOne('https://example.com/metrics');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
    http.verify();
  });

  it('does not attach expired tokens', () => {
    const { httpClient, http, clearExpiredSession } = setup(
      'expired-access-value',
      '2000-01-01T00:00:00.000Z'
    );

    httpClient.get('/api/customers').subscribe();

    const request = http.expectOne('/api/customers');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    expect(clearExpiredSession).toHaveBeenCalled();
    request.flush([]);
    http.verify();
  });

  it('does not attach expired access tokens even when a refresh token exists', () => {
    const { httpClient, http } = setup(
      'expired-access-value',
      '2000-01-01T00:00:00.000Z',
      'opaque-refresh-value'
    );

    httpClient.get('/api/customers').subscribe();

    const request = http.expectOne('/api/customers');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush([]);
    http.verify();
  });
});
