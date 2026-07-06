import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../../auth/services/auth.service';
import { API_CONFIG } from '../configuration/api-config.token';
import { SKIP_AUTH_TOKEN } from '../tokens/http-context.tokens';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(API_CONFIG);
  const authService = inject(AuthService);
  const accessToken = authService.token()?.accessToken?.trim();

  if (
    request.context.get(SKIP_AUTH_TOKEN) ||
    !accessToken ||
    request.headers.has('Authorization') ||
    !isApiRequest(request.url, config.baseUrl)
  ) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    })
  );
};

function isApiRequest(requestUrl: string, baseUrl: string): boolean {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, '');

  if (normalizedBaseUrl.length === 0) {
    return false;
  }

  if (isAbsoluteUrl(normalizedBaseUrl)) {
    return requestUrl === normalizedBaseUrl || requestUrl.startsWith(`${normalizedBaseUrl}/`);
  }

  const relativeBaseUrl = normalizedBaseUrl.startsWith('/')
    ? normalizedBaseUrl
    : `/${normalizedBaseUrl}`;

  if (isAbsoluteUrl(requestUrl)) {
    const parsedUrl = new URL(requestUrl);
    return parsedUrl.pathname === relativeBaseUrl || parsedUrl.pathname.startsWith(`${relativeBaseUrl}/`);
  }

  const relativeRequestUrl = requestUrl.startsWith('/') ? requestUrl : `/${requestUrl}`;
  return (
    relativeRequestUrl === relativeBaseUrl ||
    relativeRequestUrl.startsWith(`${relativeBaseUrl}/`)
  );
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}
