import type { JournalTotals, ManualJournalLineValue } from './manual-journal.model';

export function calculateJournalTotals(lines: readonly ManualJournalLineValue[]): JournalTotals {
  const debit = roundMoney(lines.reduce((total, line) => total + line.debitAmount, 0));
  const credit = roundMoney(lines.reduce((total, line) => total + line.creditAmount, 0));

  return {
    debit,
    credit,
    balanced: debit > 0 && debit === credit
  };
}

export function isValidManualJournalLine(line: ManualJournalLineValue): boolean {
  const hasDebit = line.debitAmount > 0;
  const hasCredit = line.creditAmount > 0;

  return line.accountId.length > 0 && hasDebit !== hasCredit;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
