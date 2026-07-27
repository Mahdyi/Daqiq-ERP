import type { ApiQuery } from '@daqiq/core';

export interface LookupTypeQuery extends ApiQuery {
  readonly search?: string;
  readonly active?: boolean;
}

export interface LookupValueQuery extends ApiQuery {
  readonly lookupTypeCode: string;
  readonly search?: string;
  readonly active?: boolean;
}
