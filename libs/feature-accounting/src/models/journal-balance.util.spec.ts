import { calculateJournalTotals, isValidManualJournalLine } from './journal-balance.util';

describe('journal balance utilities', () => {
  it('marks balanced journals as balanced', () => {
    const totals = calculateJournalTotals([
      { accountId: 'a', description: null, debitAmount: 100, creditAmount: 0 },
      { accountId: 'b', description: null, debitAmount: 0, creditAmount: 100 }
    ]);

    expect(totals).toEqual({ debit: 100, credit: 100, balanced: true });
  });

  it('rejects lines with both debit and credit', () => {
    expect(
      isValidManualJournalLine({
        accountId: 'a',
        description: null,
        debitAmount: 1,
        creditAmount: 1
      })
    ).toBeFalse();
  });
});
