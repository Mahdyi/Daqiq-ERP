import type { JournalEntryStatus, JournalSourceType } from '../models/journal-entry.model';

export interface JournalEntryRowDto {
  readonly id: string;
  readonly journal_number: string;
  readonly status_code: JournalEntryStatus;
  readonly status_label: string;
  readonly source_type_code: JournalSourceType;
  readonly source_type_label: string;
  readonly source_id: string | null;
  readonly journal_date: string;
  readonly accounting_period_id: string;
  readonly period_code: string;
  readonly description: string | null;
  readonly currency_lookup_value_id: string | null;
  readonly currency_code: string | null;
  readonly currency_label: string | null;
  readonly total_debit: string | number;
  readonly total_credit: string | number;
  readonly posted_by_email: string | null;
  readonly posted_at: string | null;
  readonly cancelled_by_email: string | null;
  readonly cancelled_at: string | null;
  readonly created_by_email: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}
