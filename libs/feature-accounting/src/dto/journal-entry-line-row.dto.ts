import type { GlAccountType } from '../models/gl-account.model';

export interface JournalEntryLineRowDto {
  readonly id: string;
  readonly journal_entry_id: string;
  readonly journal_number: string;
  readonly line_number: number;
  readonly account_id: string;
  readonly account_code: string;
  readonly account_name: string;
  readonly account_type_code: GlAccountType;
  readonly description: string | null;
  readonly debit_amount: string | number;
  readonly credit_amount: string | number;
  readonly source_line_id: string | null;
}
