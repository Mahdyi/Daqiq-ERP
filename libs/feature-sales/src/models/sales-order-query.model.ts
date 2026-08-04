import type { ApiQuery } from '@daqiq/core';

import type { SalesOrder } from './sales-order.model';

export interface SalesOrderQuery extends ApiQuery {
  readonly search?: string;
  readonly customerId?: string;
  readonly statusCode?: string;
  readonly orderDateFrom?: string;
  readonly orderDateTo?: string;
  readonly sortField?: keyof SalesOrder;
  readonly sortDirection?: 'asc' | 'desc';
}

