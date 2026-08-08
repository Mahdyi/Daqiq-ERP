import type { GlAccountType } from '../models/gl-account.model';
import type { JournalSourceType } from '../models/journal-entry.model';

export interface GeneralLedgerLineRowDto {
  readonly journal_date: string;
  readonly journal_number: string;
  readonly account_id: string;
  readonly account_code: string;
  readonly account_name: string;
  readonly account_type_code: GlAccountType;
  readonly description: string | null;
  readonly debit_amount: string | number;
  readonly credit_amount: string | number;
  readonly source_type_code: JournalSourceType;
  readonly source_id: string | null;
  readonly posted_by_email: string | null;
  readonly posted_at: string | null;
}
