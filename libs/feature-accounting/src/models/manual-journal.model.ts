export interface ManualJournalLineValue {
  readonly accountId: string;
  readonly description: string | null;
  readonly debitAmount: number;
  readonly creditAmount: number;
}

export interface ManualJournalFormValue {
  readonly journalDate: string;
  readonly description: string | null;
  readonly currencyLookupValueId: string | null;
  readonly lines: readonly ManualJournalLineValue[];
}

export interface JournalTotals {
  readonly debit: number;
  readonly credit: number;
  readonly balanced: boolean;
}
