import type { ApiRequestParamValue, ApiQuery } from '@daqiq/core';

export interface PostgrestListRequest {
  readonly params: Readonly<Record<string, ApiRequestParamValue | undefined>>;
  readonly range: string;
  readonly page: number;
  readonly pageSize: number;
}

export function buildRange(query?: ApiQuery): Pick<PostgrestListRequest, 'range' | 'page' | 'pageSize'> {
  const page = Math.max(0, query?.page ?? 0);
  const pageSize = Math.max(1, query?.pageSize ?? 20);
  const start = page * pageSize;

  return {
    page,
    pageSize,
    range: `${start}-${start + pageSize - 1}`
  };
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

export function normalizeSearchTerm(value: string | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? escapePostgrestIlikeTerm(normalized) : null;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
