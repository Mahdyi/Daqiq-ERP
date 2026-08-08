import type { JournalEntryStatus, JournalSourceType } from '../models/journal-entry.model';
import type { GlAccountType } from '../models/gl-account.model';

export interface JournalEntryResponseLineDto {
  readonly id: string;
  readonly journalEntryId: string;
  readonly lineNumber: number;
  readonly accountId: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountTypeCode: GlAccountType;
  readonly description: string | null;
  readonly debitAmount: string | number;
  readonly creditAmount: string | number;
  readonly sourceLineId: string | null;
}

export interface JournalEntryResponseDto {
  readonly id: string;
  readonly journalNumber: string;
  readonly statusCode: JournalEntryStatus;
  readonly statusLabel: string;
  readonly sourceTypeCode: JournalSourceType;
  readonly sourceTypeLabel: string;
  readonly sourceId: string | null;
  readonly journalDate: string;
  readonly accountingPeriodId: string;
  readonly periodCode: string;
  readonly description: string | null;
  readonly currencyLookupValueId: string | null;
  readonly currencyCode: string | null;
  readonly currencyLabel: string | null;
  readonly totalDebit: string | number;
  readonly totalCredit: string | number;
  readonly postedByEmail: string | null;
  readonly postedAt: string | null;
  readonly cancelledByEmail: string | null;
  readonly cancelledAt: string | null;
  readonly createdByEmail: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lines: readonly JournalEntryResponseLineDto[];
}
