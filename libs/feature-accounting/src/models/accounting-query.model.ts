import type { ApiQuery } from '@daqiq/core';

import type { GlAccount } from './gl-account.model';
import type { JournalEntry, JournalEntryStatus, JournalSourceType } from './journal-entry.model';

export interface GlAccountQuery extends ApiQuery {
  readonly search?: string;
  readonly active?: boolean;
  readonly postable?: boolean;
  readonly sortField?: keyof GlAccount;
  readonly sortDirection?: 'asc' | 'desc';
}

export interface JournalEntryQuery extends ApiQuery {
  readonly search?: string;
  readonly statusCode?: JournalEntryStatus;
  readonly sourceTypeCode?: JournalSourceType;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly sortField?: keyof JournalEntry;
  readonly sortDirection?: 'asc' | 'desc';
}

export interface GeneralLedgerQuery extends ApiQuery {
  readonly search?: string;
  readonly accountId?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly sortDirection?: 'asc' | 'desc';
}
