import type { GlAccountType } from './gl-account.model';
import type { JournalSourceType } from './journal-entry.model';

export interface GeneralLedgerLine {
  readonly rowKey: string;
  readonly journalDate: Date;
  readonly journalNumber: string;
  readonly accountId: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountTypeCode: GlAccountType;
  readonly description: string | null;
  readonly debitAmount: number;
  readonly creditAmount: number;
  readonly sourceTypeCode: JournalSourceType;
  readonly sourceId: string | null;
  readonly postedByEmail: string | null;
  readonly postedAt: Date | null;
}
