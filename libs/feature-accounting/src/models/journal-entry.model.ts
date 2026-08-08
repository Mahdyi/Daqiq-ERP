export type JournalEntryStatus = 'draft' | 'posted' | 'cancelled';
export type JournalSourceType = 'manual' | 'sales_invoice' | 'supplier_invoice';

export interface JournalEntry {
  readonly id: string;
  readonly journalNumber: string;
  readonly statusCode: JournalEntryStatus;
  readonly statusLabel: string;
  readonly sourceTypeCode: JournalSourceType;
  readonly sourceTypeLabel: string;
  readonly sourceId: string | null;
  readonly journalDate: Date;
  readonly accountingPeriodId: string;
  readonly periodCode: string;
  readonly description: string | null;
  readonly currencyLookupValueId: string | null;
  readonly currencyCode: string | null;
  readonly currencyLabel: string | null;
  readonly totalDebit: number;
  readonly totalCredit: number;
  readonly postedByEmail: string | null;
  readonly postedAt: Date | null;
  readonly cancelledByEmail: string | null;
  readonly cancelledAt: Date | null;
  readonly createdByEmail: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
