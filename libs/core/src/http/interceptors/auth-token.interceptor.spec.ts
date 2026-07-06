import { HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '../../auth/services/auth.service';
import { API_CONFIG } from '../configuration/api-config.token';
import { SKIP_AUTH_TOKEN } from '../tokens/http-context.tokens';
import { authTokenInterceptor } from './auth-token.interceptor';
import { HttpClient } from '@angular/common/http';

describe('authTokenInterceptor', () => {
  function setup(accessToken: string | null): {
    readonly httpClient: HttpClient;
    readonly http: HttpTestingController;
  } {
    const tokenSignal = signal(accessToken ? { accessToken } : null);

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
            token: tokenSignal.asReadonly()
          }
        }
      ]
    });

    return {
      httpClient: TestBed.inject(HttpClient),
      http: TestBed.inject(HttpTestingController)
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
});
