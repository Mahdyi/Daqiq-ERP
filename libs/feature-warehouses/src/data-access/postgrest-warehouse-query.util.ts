import type { ApiRequestParamValue } from '@daqiq/core';
import type { WarehouseQuery } from '../models/warehouse-query.model';
import type { Warehouse } from '../models/warehouse.model';
import { PostgrestListRequest, buildRange, isUuid, normalizeSearchTerm } from './postgrest-query.util';

export const WAREHOUSE_SELECT_COLUMNS =
  'id,code,name,description,warehouse_type_lookup_value_id,address,responsible_person,phone,email,active,created_at,updated_at';

const SORT_FIELD_MAP = {
  id: 'id',
  code: 'code',
  name: 'name',
  description: 'description',
  warehouseTypeLookupValueId: 'warehouse_type_lookup_value_id',
  address: 'address',
  responsiblePerson: 'responsible_person',
  phone: 'phone',
  email: 'email',
  active: 'active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
} satisfies Record<keyof Warehouse, string>;

export function buildPostgrestWarehouseListRequest(query?: WarehouseQuery): PostgrestListRequest {
  const range = buildRange(query);
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: WAREHOUSE_SELECT_COLUMNS,
    order: buildOrderParam(query)
  };

  if (query?.active !== undefined) {
    params['active'] = `eq.${query.active}`;
  }
  if (query?.warehouseTypeLookupValueId) {
    params['warehouse_type_lookup_value_id'] = `eq.${query.warehouseTypeLookupValueId}`;
  }

  const search = normalizeSearchTerm(query?.search);
  if (search) {
    params['or'] = [
      `code.ilike.*${search}*`,
      `name.ilike.*${search}*`,
      `description.ilike.*${search}*`,
      `responsible_person.ilike.*${search}*`,
      `phone.ilike.*${search}*`,
      `email.ilike.*${search}*`
    ].join(',');
  }

  return { ...range, params };
}

export function buildPostgrestWarehouseIdParams(id: string): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  if (!isUuid(id)) {
    throw new Error('Warehouse id must be a valid UUID.');
  }

  return { select: WAREHOUSE_SELECT_COLUMNS, id: `eq.${id}` };
}

export function buildOrderParam(query?: WarehouseQuery): string {
  const field = query?.sortField ? SORT_FIELD_MAP[query.sortField] : 'created_at';
  const direction = query?.sortDirection ?? 'desc';
  return `${field}.${direction},id.asc`;
}
