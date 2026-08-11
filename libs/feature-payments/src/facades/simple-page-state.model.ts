import type { Signal } from '@angular/core';
import type { ApiError, ApiPage } from '@daqiq/core';

export interface SimplePageState<TEntity> {
  readonly page: ApiPage<TEntity> | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
  readonly requestVersion: number;
}

export interface ReadonlyPageSignals<TEntity> {
  readonly page: Signal<ApiPage<TEntity> | null>;
  readonly items: Signal<readonly TEntity[]>;
  readonly totalItems: Signal<number>;
  readonly loading: Signal<boolean>;
  readonly error: Signal<ApiError | null>;
}
