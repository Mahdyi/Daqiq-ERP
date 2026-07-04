import type { ApiQuery } from '@daqiq/core';

export interface CrudPageRequest<TQuery extends ApiQuery = ApiQuery> {
  readonly query?: TQuery;
  readonly forceRefresh?: boolean;
}
