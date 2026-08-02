import type { ApiQuery } from '@daqiq/core';
import type { Warehouse } from './warehouse.model';

export interface WarehouseQuery extends ApiQuery {
  readonly search?: string;
  readonly active?: boolean;
  readonly warehouseTypeLookupValueId?: string;
  readonly sortField?: keyof Warehouse;
  readonly sortDirection?: 'asc' | 'desc';
}
