import type { ApiRequestParamValue } from '@daqiq/core';
import type { StorageLocationQuery } from '../models/storage-location-query.model';
import type { StorageLocation } from '../models/storage-location.model';
import { PostgrestListRequest, buildRange, isUuid, normalizeSearchTerm } from './postgrest-query.util';

export const STORAGE_LOCATION_SELECT_COLUMNS =
  'id,warehouse_id,code,name,description,location_type_lookup_value_id,parent_location_id,active,created_at,updated_at';

const SORT_FIELD_MAP = {
  id: 'id',
  warehouseId: 'warehouse_id',
  code: 'code',
  name: 'name',
  description: 'description',
  locationTypeLookupValueId: 'location_type_lookup_value_id',
  parentLocationId: 'parent_location_id',
  active: 'active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
} satisfies Record<keyof StorageLocation, string>;

export function buildPostgrestStorageLocationListRequest(
  query?: StorageLocationQuery
): PostgrestListRequest {
  const range = buildRange(query);
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: STORAGE_LOCATION_SELECT_COLUMNS,
    order: buildOrderParam(query)
  };

  if (query?.active !== undefined) {
    params['active'] = `eq.${query.active}`;
  }
  if (query?.warehouseId) {
    params['warehouse_id'] = `eq.${query.warehouseId}`;
  }
  if (query?.locationTypeLookupValueId) {
    params['location_type_lookup_value_id'] = `eq.${query.locationTypeLookupValueId}`;
  }
  if (query?.parentLocationId) {
    params['parent_location_id'] = `eq.${query.parentLocationId}`;
  }

  const search = normalizeSearchTerm(query?.search);
  if (search) {
    params['or'] = [
      `code.ilike.*${search}*`,
      `name.ilike.*${search}*`,
      `description.ilike.*${search}*`
    ].join(',');
  }

  return { ...range, params };
}

export function buildPostgrestStorageLocationIdParams(id: string): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  if (!isUuid(id)) {
    throw new Error('Storage location id must be a valid UUID.');
  }

  return { select: STORAGE_LOCATION_SELECT_COLUMNS, id: `eq.${id}` };
}

export function buildOrderParam(query?: StorageLocationQuery): string {
  const field = query?.sortField ? SORT_FIELD_MAP[query.sortField] : 'created_at';
  const direction = query?.sortDirection ?? 'desc';
  return `${field}.${direction},id.asc`;
}
