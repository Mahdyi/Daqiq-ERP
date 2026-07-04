import type { ApiError } from '@daqiq/core';

export type CrudMutationResult<TEntity> =
  | {
      readonly success: true;
      readonly data: TEntity;
    }
  | {
      readonly success: false;
      readonly error: ApiError;
    };

export type CrudDeleteResult =
  | {
      readonly success: true;
    }
  | {
      readonly success: false;
      readonly error: ApiError;
    };
