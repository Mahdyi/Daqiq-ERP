import type { ApiPage, ApiQuery } from '@daqiq/core';
import type { Observable } from 'rxjs';

import type { CrudId } from './crud-id.model';

export interface CrudResource<
  TEntity,
  TId extends CrudId,
  TCreateRequest,
  TUpdateRequest,
  TQuery extends ApiQuery = ApiQuery
> {
  list(query?: TQuery): Observable<ApiPage<TEntity>>;
  getById(id: TId): Observable<TEntity>;
  create(request: TCreateRequest): Observable<TEntity>;
  update(id: TId, request: TUpdateRequest): Observable<TEntity>;
  delete(id: TId): Observable<void>;
}
