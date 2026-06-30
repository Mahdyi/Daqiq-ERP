import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../api-client/api-client.service';
import { ApiPage } from '../models/api-page.model';
import { ApiQuery, ApiQueryValue } from '../models/api-query.model';
import { ApiRequestParamValue } from '../models/api-request-options.model';

export abstract class BaseRepository<
  TEntity,
  TId extends string | number,
  TCreateRequest,
  TUpdateRequest,
  TListQuery extends ApiQuery = ApiQuery
> {
  protected abstract readonly resourcePath: string;
  protected readonly api = inject(ApiClient);

  list(query?: TListQuery): Observable<ApiPage<TEntity>> {
    return this.api.get<ApiPage<TEntity>>(this.resourcePath, {
      params: this.toRequestParams(query)
    });
  }

  getById(id: TId): Observable<TEntity> {
    return this.api.get<TEntity>(this.buildResourcePath(id));
  }

  create(request: TCreateRequest): Observable<TEntity> {
    return this.api.post<TCreateRequest, TEntity>(this.resourcePath, request);
  }

  update(id: TId, request: TUpdateRequest): Observable<TEntity> {
    return this.api.put<TUpdateRequest, TEntity>(this.buildResourcePath(id), request);
  }

  delete(id: TId): Observable<void> {
    return this.api.delete<void>(this.buildResourcePath(id));
  }

  protected buildResourcePath(...segments: readonly (string | number)[]): string {
    const base = this.resourcePath.replace(/\/+$/, '');
    const encodedSegments = segments.map((segment) => encodeURIComponent(String(segment)));

    return [base, ...encodedSegments].join('/');
  }

  private toRequestParams(
    query?: TListQuery
  ): Readonly<Record<string, ApiRequestParamValue | undefined>> | undefined {
    if (!query) {
      return undefined;
    }

    const params: Record<string, ApiRequestParamValue | undefined> = {
      page: query.page,
      pageSize: query.pageSize,
      sort: query.sort
    };

    if (query.filters) {
      for (const [key, value] of Object.entries(query.filters)) {
        params[`filter.${key}`] = this.toRequestParamValue(value);
      }
    }

    return params;
  }

  private toRequestParamValue(value: ApiQueryValue | undefined): ApiRequestParamValue | undefined {
    return value;
  }
}
