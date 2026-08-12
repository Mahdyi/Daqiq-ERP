import type { ApiRequestParamValue } from '@daqiq/core';

import type { ReportQuery } from '../models/report-query.model';

export interface PostgrestReportListRequest {
  readonly params: Readonly<Record<string, ApiRequestParamValue | undefined>>;
  readonly range: string;
  readonly page: number;
  readonly pageSize: number;
}

export function buildReportListRequest(
  select: string,
  order: string,
  query?: ReportQuery,
  searchFields: readonly string[] = []
): PostgrestReportListRequest {
  const page = Math.max(0, query?.page ?? 0);
  const pageSize = Math.max(1, query?.pageSize ?? 20);
  const start = page * pageSize;
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select,
    order
  };

  if (query?.statusCode) {
    params['status_code'] = `eq.${query.statusCode}`;
  }
  if (query?.warehouseId) {
    params['warehouse_id'] = `eq.${query.warehouseId}`;
  }
  if (query?.productId) {
    params['product_id'] = `eq.${query.productId}`;
  }
  if (query?.accountId) {
    params['account_id'] = `eq.${query.accountId}`;
  }

  const search = normalizeSearch(query?.search);
  if (search && searchFields.length > 0) {
    params['or'] = searchFields.map((field) => `${field}.ilike.*${search}*`).join(',');
  }

  return {
    params,
    page,
    pageSize,
    range: `${start}-${start + pageSize - 1}`
  };
}

function normalizeSearch(value: string | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? escapePostgrestIlikeTerm(normalized) : null;
}

function escapePostgrestIlikeTerm(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/%/g, '\\%')
    .replace(/,/g, '\\,')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}
