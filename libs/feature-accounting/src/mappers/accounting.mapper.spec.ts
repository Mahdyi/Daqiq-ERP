import { mapJournalEntryRow } from './accounting.mapper';
import type { JournalEntryRowDto } from '../dto/journal-entry-row.dto';

describe('accounting mapper', () => {
  it('maps journal rows with numeric totals and dates', () => {
    const row: JournalEntryRowDto = {
      id: '7f0e51e5-4c8f-4e66-8b2d-86c81308e6f2',
      journal_number: 'JE-2026-000001',
      status_code: 'posted',
      status_label: 'ثبت‌شده',
      source_type_code: 'manual',
      source_type_label: 'دستی',
      source_id: null,
      journal_date: '2026-08-08',
      accounting_period_id: '70e2d490-56d1-46e5-a9a2-86502b3ec291',
      period_code: '2026-08',
      description: null,
      currency_lookup_value_id: null,
      currency_code: null,
      currency_label: null,
      total_debit: '100.25',
      total_credit: '100.25',
      posted_by_email: 'admin@erp.com',
      posted_at: '2026-08-08T10:00:00Z',
      cancelled_by_email: null,
      cancelled_at: null,
      created_by_email: 'admin@erp.com',
      created_at: '2026-08-08T09:00:00Z',
      updated_at: '2026-08-08T10:00:00Z'
    };

    const result = mapJournalEntryRow(row);

    expect(result.totalDebit).toBe(100.25);
    expect(result.totalCredit).toBe(100.25);
    expect(result.journalDate instanceof Date).toBeTrue();
  });
});
