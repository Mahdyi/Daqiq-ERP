import {
  HttpClient,
  HttpContext,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiConfig } from '../configuration/api-config.model';
import { API_CONFIG } from '../configuration/api-config.token';
import { joinApiUrl } from '../configuration/api-url.util';
import { ApiEnvelope } from '../models/api-envelope.model';
import {
  ApiRequestOptions,
  NormalizedApiRequestOptions
} from '../models/api-request-options.model';

@Injectable({
  providedIn: 'root'
})
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  get<TResponse>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Observable<TResponse> {
    const requestOptions = this.normalizeOptions(options);

    return this.unwrap<TResponse>(
      this.http.get<TResponse | ApiEnvelope<TResponse>>(
        joinApiUrl(this.config.baseUrl, endpoint),
        requestOptions
      ),
      requestOptions.responseShape
    );
  }

  post<TRequest, TResponse>(
    endpoint: string,
    body: TRequest,
    options?: ApiRequestOptions
  ): Observable<TResponse> {
    const requestOptions = this.normalizeOptions(options);

    return this.unwrap<TResponse>(
      this.http.post<TResponse | ApiEnvelope<TResponse>>(
        joinApiUrl(this.config.baseUrl, endpoint),
        body,
        requestOptions
      ),
      requestOptions.responseShape
    );
  }

  put<TRequest, TResponse>(
    endpoint: string,
    body: TRequest,
    options?: ApiRequestOptions
  ): Observable<TResponse> {
    const requestOptions = this.normalizeOptions(options);

    return this.unwrap<TResponse>(
      this.http.put<TResponse | ApiEnvelope<TResponse>>(
        joinApiUrl(this.config.baseUrl, endpoint),
        body,
        requestOptions
      ),
      requestOptions.responseShape
    );
  }

  patch<TRequest, TResponse>(
    endpoint: string,
    body: TRequest,
    options?: ApiRequestOptions
  ): Observable<TResponse> {
    const requestOptions = this.normalizeOptions(options);

    return this.unwrap<TResponse>(
      this.http.patch<TResponse | ApiEnvelope<TResponse>>(
        joinApiUrl(this.config.baseUrl, endpoint),
        body,
        requestOptions
      ),
      requestOptions.responseShape
    );
  }

  delete<TResponse>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Observable<TResponse> {
    const requestOptions = this.normalizeOptions(options);

    return this.unwrap<TResponse>(
      this.http.delete<TResponse | ApiEnvelope<TResponse>>(
        joinApiUrl(this.config.baseUrl, endpoint),
        requestOptions
      ),
      requestOptions.responseShape
    );
  }

  private unwrap<TResponse>(
    response: Observable<TResponse | ApiEnvelope<TResponse>>,
    responseShape: 'envelope' | 'raw'
  ): Observable<TResponse> {
    if (responseShape === 'raw') {
      return response as Observable<TResponse>;
    }

    return response.pipe(map((envelope) => (envelope as ApiEnvelope<TResponse>).data));
  }

  private normalizeOptions(options?: ApiRequestOptions): NormalizedApiRequestOptions {
    return {
      context: options?.context ?? new HttpContext(),
      headers: this.buildHeaders(this.config, options?.headers),
      params: this.buildParams(options?.params),
      responseShape: options?.responseShape ?? 'envelope'
    };
  }

  private buildHeaders(
    config: ApiConfig,
    headers?: ApiRequestOptions['headers']
  ): HttpHeaders {
    let result = new HttpHeaders(config.defaultHeaders ?? {});

    if (headers instanceof HttpHeaders) {
      for (const key of headers.keys()) {
        const values = headers.getAll(key) ?? [];
        result = result.delete(key);

        for (const value of values) {
          result = result.append(key, value);
        }
      }

      return result;
    }

    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        result = result.set(key, value);
      }
    }

    return result;
  }

  private buildParams(params?: ApiRequestOptions['params']): HttpParams {
    if (params instanceof HttpParams) {
      return params;
    }

    let result = new HttpParams();

    if (!params) {
      return result;
    }

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          result = result.append(key, String(item));
        }
      } else {
        result = result.set(key, String(value));
      }
    }

    return result;
  }
}
