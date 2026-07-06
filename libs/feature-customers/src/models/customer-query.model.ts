import { ApiQuery } from '@daqiq/core';

import { Customer } from './customer.model';

export interface CustomerQuery extends ApiQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly sort?: readonly string[];
  readonly sortField?: keyof Customer;
  readonly sortDirection?: 'asc' | 'desc';
  readonly search?: string;
  readonly active?: boolean;
}
