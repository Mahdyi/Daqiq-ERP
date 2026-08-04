import type { ApiQuery } from '@daqiq/core';

import type { SalesDelivery } from './sales-delivery.model';
import type { SalesDeliveryStatus } from './sales-delivery-status.model';

export interface SalesDeliveryQuery extends ApiQuery {
  readonly search?: string;
  readonly salesOrderId?: string;
  readonly customerId?: string;
  readonly warehouseId?: string;
  readonly statusCode?: SalesDeliveryStatus;
  readonly deliveryDateFrom?: string;
  readonly deliveryDateTo?: string;
  readonly sortField?: keyof SalesDelivery;
  readonly sortDirection?: 'asc' | 'desc';
}
