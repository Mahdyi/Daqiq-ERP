import { ApiQuery } from '@daqiq/core';

export interface UserQuery extends ApiQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly active?: boolean;
}
