import type { ApiRequestParamValue } from '@daqiq/core';

import type { GlAccountQuery, GeneralLedgerQuery, JournalEntryQuery } from '../models/accounting-query.model';
import type { GlAccount } from '../models/gl-account.model';
import type { JournalEntry } from '../models/journal-entry.model';

export interface PostgrestListRequest {
  readonly params: Readonly<Record<string, ApiRequestParamValue | undefined>>;
  readonly range: string;
  readonly page: number;
  readonly pageSize: number;
}

export const GL_ACCOUNT_SELECT =
  'id,account_code,account_name,account_type_lookup_value_id,account_type_code,account_type_label,parent_account_id,parent_account_code,parent_account_name,description,is_postable,active,created_at,updated_at';

export const ACCOUNTING_PERIOD_SELECT =
  'id,period_code,period_name,start_date,end_date,is_closed,created_at,updated_at';

export const JOURNAL_ENTRY_SELECT =
  'id,journal_number,status_code,status_label,source_type_code,source_type_label,source_id,journal_date,accounting_period_id,period_code,description,currency_lookup_value_id,currency_code,currency_label,total_debit,total_credit,posted_by_email,posted_at,cancelled_by_email,cancelled_at,created_by_email,created_at,updated_at';

export const JOURNAL_LINE_SELECT =
  'id,journal_entry_id,journal_number,line_number,account_id,account_code,account_name,account_type_code,description,debit_amount,credit_amount,source_line_id';

export const GENERAL_LEDGER_SELECT =
  'journal_date,journal_number,account_id,account_code,account_name,account_type_code,description,debit_amount,credit_amount,source_type_code,source_id,posted_by_email,posted_at';

const GL_ACCOUNT_SORT = {
  id: 'id',
  accountCode: 'account_code',
  accountName: 'account_name',
  accountTypeLookupValueId: 'account_type_lookup_value_id',
  accountTypeCode: 'account_type_code',
  accountTypeLabel: 'account_type_label',
  parentAccountId: 'parent_account_id',
  parentAccountCode: 'parent_account_code',
  parentAccountName: 'parent_account_name',
  description: 'description',
  isPostable: 'is_postable',
  active: 'active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
} satisfies Record<keyof GlAccount, string>;

const JOURNAL_ENTRY_SORT = {
  id: 'id',
  journalNumber: 'journal_number',
  statusCode: 'status_code',
  statusLabel: 'status_label',
  sourceTypeCode: 'source_type_code',
  sourceTypeLabel: 'source_type_label',
  sourceId: 'source_id',
  journalDate: 'journal_date',
  accountingPeriodId: 'accounting_period_id',
  periodCode: 'period_code',
  description: 'description',
  currencyLookupValueId: 'currency_lookup_value_id',
  currencyCode: 'currency_code',
  currencyLabel: 'currency_label',
  totalDebit: 'total_debit',
  totalCredit: 'total_credit',
  postedByEmail: 'posted_by_email',
  postedAt: 'posted_at',
  cancelledByEmail: 'cancelled_by_email',
  cancelledAt: 'cancelled_at',
  createdByEmail: 'created_by_email',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
} satisfies Record<keyof JournalEntry, string>;

export function buildGlAccountListRequest(query?: GlAccountQuery): PostgrestListRequest {
  const request = buildPage(query?.page, query?.pageSize);
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: GL_ACCOUNT_SELECT,
    order: `${query?.sortField ? GL_ACCOUNT_SORT[query.sortField] : 'account_code'}.${query?.sortDirection ?? 'asc'},id.asc`
  };

  if (query?.active !== undefined) {
    params['active'] = `eq.${query.active}`;
  }

  if (query?.postable !== undefined) {
    params['is_postable'] = `eq.${query.postable}`;
  }

  const search = normalizeSearch(query?.search);

  if (search) {
    params['or'] = [
      `account_code.ilike.*${search}*`,
      `account_name.ilike.*${search}*`,
      `account_type_label.ilike.*${search}*`
    ].join(',');
  }

  return { ...request, params };
}

export function buildAccountingPeriodListRequest(): PostgrestListRequest {
  return {
    ...buildPage(0, 100),
    params: {
      select: ACCOUNTING_PERIOD_SELECT,
      order: 'start_date.desc'
    }
  };
}

export function buildJournalEntryListRequest(query?: JournalEntryQuery): PostgrestListRequest {
  const request = buildPage(query?.page, query?.pageSize);
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: JOURNAL_ENTRY_SELECT,
    order: `${query?.sortField ? JOURNAL_ENTRY_SORT[query.sortField] : 'journal_date'}.${query?.sortDirection ?? 'desc'},id.desc`
  };

  if (query?.statusCode) {
    params['status_code'] = `eq.${query.statusCode}`;
  }

  if (query?.sourceTypeCode) {
    params['source_type_code'] = `eq.${query.sourceTypeCode}`;
  }

  addDateRange(params, 'journal_date', query?.dateFrom, query?.dateTo);

  const search = normalizeSearch(query?.search);

  if (search) {
    params['or'] = [
      `journal_number.ilike.*${search}*`,
      `period_code.ilike.*${search}*`,
      `description.ilike.*${search}*`
    ].join(',');
  }

  return { ...request, params };
}

export function buildJournalEntryIdParams(
  id: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  assertUuid(id);

  return {
    select: JOURNAL_ENTRY_SELECT,
    id: `eq.${id}`
  };
}

export function buildJournalLineParams(
  journalEntryId: string
): Readonly<Record<string, ApiRequestParamValue | undefined>> {
  assertUuid(journalEntryId);

  return {
    select: JOURNAL_LINE_SELECT,
    journal_entry_id: `eq.${journalEntryId}`,
    order: 'line_number.asc'
  };
}

export function buildGeneralLedgerListRequest(query?: GeneralLedgerQuery): PostgrestListRequest {
  const request = buildPage(query?.page, query?.pageSize);
  const params: Record<string, ApiRequestParamValue | undefined> = {
    select: GENERAL_LEDGER_SELECT,
    order: `journal_date.${query?.sortDirection ?? 'desc'},journal_number.desc`
  };

  if (query?.accountId) {
    assertUuid(query.accountId);
    params['account_id'] = `eq.${query.accountId}`;
  }

  addDateRange(params, 'journal_date', query?.dateFrom, query?.dateTo);

  const search = normalizeSearch(query?.search);

  if (search) {
    params['or'] = [
      `journal_number.ilike.*${search}*`,
      `account_code.ilike.*${search}*`,
      `account_name.ilike.*${search}*`,
      `description.ilike.*${search}*`
    ].join(',');
  }

  return { ...request, params };
}

function buildPage(page: number | undefined, pageSize: number | undefined): Omit<PostgrestListRequest, 'params'> {
  const resolvedPage = Math.max(0, page ?? 0);
  const resolvedPageSize = Math.max(1, pageSize ?? 20);
  const start = resolvedPage * resolvedPageSize;

  return {
    range: `${start}-${start + resolvedPageSize - 1}`,
    page: resolvedPage,
    pageSize: resolvedPageSize
  };
}

function addDateRange(
  params: Record<string, ApiRequestParamValue | undefined>,
  field: string,
  from: string | undefined,
  to: string | undefined
): void {
  if (from) {
    params[field] = `gte.${from}`;
  }

  if (to) {
    params[field] = params[field] ? [`${params[field]}`, `lte.${to}`] : `lte.${to}`;
  }
}

function normalizeSearch(value: string | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized ? escapePostgrestIlikeTerm(normalized) : null;
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

function assertUuid(value: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value)) {
    throw new Error('Accounting identifier must be a valid UUID.');
  }
}
