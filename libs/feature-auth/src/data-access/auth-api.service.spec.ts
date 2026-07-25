import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiClient, API_CONFIG, SKIP_AUTH_TOKEN } from '@daqiq/core';

import { AuthApiService } from './auth-api.service';

describe('AuthApiService', () => {
  it('calls PostgREST login RPC without attaching an existing auth token', () => {
    TestBed.configureTestingModule({
      providers: [
        AuthApiService,
        ApiClient,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: API_CONFIG,
          useValue: {
            baseUrl: '/api'
          }
        }
      ]
    });

    const service = TestBed.inject(AuthApiService);
    const http = TestBed.inject(HttpTestingController);
    let accessToken = '';

    service.login({
      email: 'admin@erp.com',
      password: 'admin'
    }).subscribe((response) => {
      accessToken = response.accessToken;
    });

    const request = http.expectOne('/api/rpc/login');

    expect(request.request.method).toBe('POST');
    expect(request.request.context.get(SKIP_AUTH_TOKEN)).toBeTrue();
    request.flush({
      accessToken: 'opaque-test-access-value',
      refreshToken: 'opaque-refresh-value',
      tokenType: 'Bearer',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: {
        id: '1',
        email: 'admin@erp.com',
        displayName: 'Admin',
        roles: ['admin']
      }
    });

    expect(accessToken).toBe('opaque-test-access-value');
    http.verify();
  });

  it('calls refresh RPC with the refresh token and skips auth token attachment', () => {
    TestBed.configureTestingModule({
      providers: [
        AuthApiService,
        ApiClient,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: API_CONFIG,
          useValue: {
            baseUrl: '/api'
          }
        }
      ]
    });

    const service = TestBed.inject(AuthApiService);
    const http = TestBed.inject(HttpTestingController);

    service.refreshSession({
      refreshToken: 'opaque-refresh-value'
    }).subscribe();

    const request = http.expectOne('/api/rpc/refresh_session');

    expect(request.request.method).toBe('POST');
    expect(request.request.context.get(SKIP_AUTH_TOKEN)).toBeTrue();
    expect(request.request.body).toEqual({
      refresh_token: 'opaque-refresh-value'
    });
    request.flush({
      accessToken: 'new-access-value',
      refreshToken: 'new-refresh-value',
      tokenType: 'Bearer',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: {
        id: '1',
        email: 'admin@erp.com',
        displayName: 'Admin',
        roles: ['admin']
      }
    });

    http.verify();
  });

  it('calls logout RPC without attaching an existing auth token', () => {
    TestBed.configureTestingModule({
      providers: [
        AuthApiService,
        ApiClient,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: API_CONFIG,
          useValue: {
            baseUrl: '/api'
          }
        }
      ]
    });

    const service = TestBed.inject(AuthApiService);
    const http = TestBed.inject(HttpTestingController);

    service.logout({
      refreshToken: 'opaque-refresh-value'
    }).subscribe();

    const request = http.expectOne('/api/rpc/logout');

    expect(request.request.method).toBe('POST');
    expect(request.request.context.get(SKIP_AUTH_TOKEN)).toBeTrue();
    expect(request.request.body).toEqual({
      refresh_token: 'opaque-refresh-value'
    });
    request.flush({
      success: true
    });

    http.verify();
  });
});
