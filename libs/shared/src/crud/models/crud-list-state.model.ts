import type { ApiError, ApiPage } from '@daqiq/core';

export interface CrudListState<TEntity> {
  readonly page: ApiPage<TEntity> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
  readonly requestVersion: number;
}
