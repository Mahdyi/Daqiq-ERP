import type { ApiQuery } from '@daqiq/core';
import type { Supplier } from './supplier.model';

export interface SupplierQuery extends ApiQuery {
  readonly search?: string;
  readonly active?: boolean;
  readonly supplierGroupLookupValueId?: string;
  readonly currencyLookupValueId?: string;
  readonly sortField?: keyof Supplier;
  readonly sortDirection?: 'asc' | 'desc';
}
