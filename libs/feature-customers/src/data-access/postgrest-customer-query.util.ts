import { ApiRequestParamValue } from '@daqiq/core';

import { Customer } from '../models/customer.model';
import { CustomerQuery } from '../models/customer-query.model';

export const CUSTOMER_SELECT_COLUMNS =
  'id,code,name,email,phone,customer_type,credit_limit,active,created_at,updated_at';

const SORT_FIELD_MAP = {
  id: 'id',
  code: 'code',
  name: 'name',
  email: 'email',
  phone: 'phone',
  customerType: 'customer_type',
  creditLimit: 'credit_limit',
  active: 'active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
} satisfies Record<keyof Customer, string>;

export interface PostgrestCustomerListRequest {
  readonly params: Readonly<Record<string, ApiRequestParamValue | undefined>>;
  readonly range: string;
  readonly page: number;
  readonly pageSize: number;
}

export function buildPostgrestCustomerListRequest(
  query?: CustomerQuery
): PostgrestCustomerListRequest {
  const page = Math.max(0, query?.page ?? 0);
  const pageSize = Math.max(1, query?.pageSize ?? 20);
  const start = page * pageSize;
  const end = start + pageSize - 1;
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: CUSTOMER_SELECT_COLUMNS,
    order: buildOrderParam(query)
  };

  if (query?.active !== undefined) {
    params['active'] = `eq.${query.active}`;
  }

  const search = normalizeSearchTerm(query?.search);

  if (search) {
    params['or'] = buildSearchParam(search);
  }

  return {
    params,
    range: `${start}-${end}`,
    page,
    pageSize
  };
}

export function buildPostgrestIdParams(
  id: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  if (!isUuid(id)) {
    throw new Error('Customer id must be a valid UUID.');
  }

  return {
    select: CUSTOMER_SELECT_COLUMNS,
    id: `eq.${id}`
  };
}

export function buildOrderParam(query?: CustomerQuery): string {
  const field = query?.sortField ? SORT_FIELD_MAP[query.sortField] : 'created_at';
  const direction = query?.sortDirection ?? 'desc';

  if (!field) {
    return 'created_at.desc,id.asc';
  }

  return `${field}.${direction},id.asc`;
}

export function escapePostgrestIlikeTerm(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/%/g, '\\%')
    .replace(/,/g, '\\,')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function normalizeSearchTerm(value: string | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? escapePostgrestIlikeTerm(normalized) : null;
}

function buildSearchParam(search: string): string {
  return [
    `code.ilike.*${search}*`,
    `name.ilike.*${search}*`,
    `email.ilike.*${search}*`,
    `phone.ilike.*${search}*`
  ].join(',');
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
