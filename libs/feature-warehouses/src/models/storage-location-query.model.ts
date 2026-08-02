import type { ApiQuery } from '@daqiq/core';
import type { StorageLocation } from './storage-location.model';

export interface StorageLocationQuery extends ApiQuery {
  readonly search?: string;
  readonly active?: boolean;
  readonly warehouseId?: string;
  readonly locationTypeLookupValueId?: string;
  readonly parentLocationId?: string;
  readonly sortField?: keyof StorageLocation;
  readonly sortDirection?: 'asc' | 'desc';
}
