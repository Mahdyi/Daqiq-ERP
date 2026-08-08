export interface ManualJournalLineRequestDto {
  readonly accountId: string;
  readonly description: string | null;
  readonly debitAmount: number;
  readonly creditAmount: number;
}

export interface CreateManualJournalRequestDto {
  readonly journal_date: string;
  readonly description: string | null;
  readonly currency_lookup_value_id: string | null;
  readonly lines: readonly ManualJournalLineRequestDto[];
}

export interface JournalEntryTransitionRequestDto {
  readonly journal_entry_id: string;
}

export interface InvoiceAccountingPostingRequestDto {
  readonly sales_invoice_id?: string;
  readonly supplier_invoice_id?: string;
}
