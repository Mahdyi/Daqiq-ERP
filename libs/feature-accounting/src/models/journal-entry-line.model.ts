import type { GlAccountType } from './gl-account.model';

export interface JournalEntryLine {
  readonly id: string;
  readonly journalEntryId: string;
  readonly journalNumber: string;
  readonly lineNumber: number;
  readonly accountId: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountTypeCode: GlAccountType;
  readonly description: string | null;
  readonly debitAmount: number;
  readonly creditAmount: number;
  readonly sourceLineId: string | null;
}
