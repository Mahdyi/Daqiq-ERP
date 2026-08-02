import type { ApiRequestParamValue } from '@daqiq/core';

import type { SupplierQuery } from '../models/supplier-query.model';
import type { Supplier } from '../models/supplier.model';

export const SUPPLIER_SELECT_COLUMNS =
  'id,code,name,email,phone,tax_number,contact_person,website,address,supplier_group_lookup_value_id,currency_lookup_value_id,payment_terms_days,active,created_at,updated_at';

const SORT_FIELD_MAP = {
  id: 'id',
  code: 'code',
  name: 'name',
  email: 'email',
  phone: 'phone',
  taxNumber: 'tax_number',
  contactPerson: 'contact_person',
  website: 'website',
  address: 'address',
  supplierGroupLookupValueId: 'supplier_group_lookup_value_id',
  currencyLookupValueId: 'currency_lookup_value_id',
  paymentTermsDays: 'payment_terms_days',
  active: 'active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
} satisfies Record<keyof Supplier, string>;

export interface PostgrestSupplierListRequest {
  readonly params: Readonly<Record<string, ApiRequestParamValue | undefined>>;
  readonly range: string;
  readonly page: number;
  readonly pageSize: number;
}

export function buildPostgrestSupplierListRequest(
  query?: SupplierQuery
): PostgrestSupplierListRequest {
  const page = Math.max(0, query?.page ?? 0);
  const pageSize = Math.max(1, query?.pageSize ?? 20);
  const start = page * pageSize;
  const end = start + pageSize - 1;
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: SUPPLIER_SELECT_COLUMNS,
    order: buildOrderParam(query)
  };

  if (query?.active !== undefined) {
    params['active'] = `eq.${query.active}`;
  }

  if (query?.supplierGroupLookupValueId) {
    params['supplier_group_lookup_value_id'] = `eq.${query.supplierGroupLookupValueId}`;
  }

  if (query?.currencyLookupValueId) {
    params['currency_lookup_value_id'] = `eq.${query.currencyLookupValueId}`;
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

export function buildPostgrestSupplierIdParams(
  id: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  if (!isUuid(id)) {
    throw new Error('Supplier id must be a valid UUID.');
  }

  return {
    select: SUPPLIER_SELECT_COLUMNS,
    id: `eq.${id}`
  };
}

export function buildOrderParam(query?: SupplierQuery): string {
  const field = query?.sortField ? SORT_FIELD_MAP[query.sortField] : 'created_at';
  const direction = query?.sortDirection ?? 'desc';

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
    `phone.ilike.*${search}*`,
    `tax_number.ilike.*${search}*`,
    `contact_person.ilike.*${search}*`
  ].join(',');
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
