import type { ApiQuery } from '@daqiq/core';

import type { PurchaseOrder } from './purchase-order.model';

export interface PurchaseOrderQuery extends ApiQuery {
  readonly search?: string;
  readonly supplierId?: string;
  readonly statusCode?: string;
  readonly orderDateFrom?: string;
  readonly orderDateTo?: string;
  readonly sortField?: keyof PurchaseOrder;
  readonly sortDirection?: 'asc' | 'desc';
}
