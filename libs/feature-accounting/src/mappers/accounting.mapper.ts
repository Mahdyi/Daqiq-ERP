import type { AccountingPeriodRowDto } from '../dto/accounting-period-row.dto';
import type { GeneralLedgerLineRowDto } from '../dto/general-ledger-line-row.dto';
import type { GlAccountRowDto } from '../dto/gl-account-row.dto';
import type { JournalEntryLineRowDto } from '../dto/journal-entry-line-row.dto';
import type {
  JournalEntryResponseDto,
  JournalEntryResponseLineDto
} from '../dto/journal-entry-response.dto';
import type { JournalEntryRowDto } from '../dto/journal-entry-row.dto';
import type { AccountingPeriod } from '../models/accounting-period.model';
import type { GeneralLedgerLine } from '../models/general-ledger-line.model';
import type { GlAccount } from '../models/gl-account.model';
import type { JournalEntryLine } from '../models/journal-entry-line.model';
import type { JournalEntry } from '../models/journal-entry.model';

export function mapGlAccountRow(row: GlAccountRowDto): GlAccount {
  return {
    id: row.id,
    accountCode: row.account_code,
    accountName: row.account_name,
    accountTypeLookupValueId: row.account_type_lookup_value_id,
    accountTypeCode: row.account_type_code,
    accountTypeLabel: row.account_type_label,
    parentAccountId: row.parent_account_id,
    parentAccountCode: row.parent_account_code,
    parentAccountName: row.parent_account_name,
    description: row.description,
    isPostable: row.is_postable,
    active: row.active,
    createdAt: parseDate(row.created_at, 'GL account created date'),
    updatedAt: parseDate(row.updated_at, 'GL account updated date')
  };
}

export function mapAccountingPeriodRow(row: AccountingPeriodRowDto): AccountingPeriod {
  return {
    id: row.id,
    periodCode: row.period_code,
    periodName: row.period_name,
    startDate: parseDate(row.start_date, 'Accounting period start date'),
    endDate: parseDate(row.end_date, 'Accounting period end date'),
    isClosed: row.is_closed,
    createdAt: parseDate(row.created_at, 'Accounting period created date'),
    updatedAt: parseDate(row.updated_at, 'Accounting period updated date')
  };
}

export function mapJournalEntryRow(row: JournalEntryRowDto): JournalEntry {
  return {
    id: row.id,
    journalNumber: row.journal_number,
    statusCode: row.status_code,
    statusLabel: row.status_label,
    sourceTypeCode: row.source_type_code,
    sourceTypeLabel: row.source_type_label,
    sourceId: row.source_id,
    journalDate: parseDate(row.journal_date, 'Journal date'),
    accountingPeriodId: row.accounting_period_id,
    periodCode: row.period_code,
    description: row.description,
    currencyLookupValueId: row.currency_lookup_value_id,
    currencyCode: row.currency_code,
    currencyLabel: row.currency_label,
    totalDebit: parseNumber(row.total_debit, 'Journal total debit'),
    totalCredit: parseNumber(row.total_credit, 'Journal total credit'),
    postedByEmail: row.posted_by_email,
    postedAt: parseNullableDate(row.posted_at, 'Journal posted date'),
    cancelledByEmail: row.cancelled_by_email,
    cancelledAt: parseNullableDate(row.cancelled_at, 'Journal cancelled date'),
    createdByEmail: row.created_by_email,
    createdAt: parseDate(row.created_at, 'Journal created date'),
    updatedAt: parseDate(row.updated_at, 'Journal updated date')
  };
}

export function mapJournalEntryLineRow(row: JournalEntryLineRowDto): JournalEntryLine {
  return {
    id: row.id,
    journalEntryId: row.journal_entry_id,
    journalNumber: row.journal_number,
    lineNumber: row.line_number,
    accountId: row.account_id,
    accountCode: row.account_code,
    accountName: row.account_name,
    accountTypeCode: row.account_type_code,
    description: row.description,
    debitAmount: parseNumber(row.debit_amount, 'Journal line debit'),
    creditAmount: parseNumber(row.credit_amount, 'Journal line credit'),
    sourceLineId: row.source_line_id
  };
}

export function mapGeneralLedgerLineRow(row: GeneralLedgerLineRowDto): GeneralLedgerLine {
  const debitAmount = parseNumber(row.debit_amount, 'General ledger debit');
  const creditAmount = parseNumber(row.credit_amount, 'General ledger credit');

  return {
    rowKey: [
      row.journal_number,
      row.account_id,
      row.description ?? '',
      String(debitAmount),
      String(creditAmount)
    ].join('|'),
    journalDate: parseDate(row.journal_date, 'General ledger journal date'),
    journalNumber: row.journal_number,
    accountId: row.account_id,
    accountCode: row.account_code,
    accountName: row.account_name,
    accountTypeCode: row.account_type_code,
    description: row.description,
    debitAmount,
    creditAmount,
    sourceTypeCode: row.source_type_code,
    sourceId: row.source_id,
    postedByEmail: row.posted_by_email,
    postedAt: parseNullableDate(row.posted_at, 'General ledger posted date')
  };
}

export function mapJournalEntryResponse(dto: JournalEntryResponseDto): {
  readonly entry: JournalEntry;
  readonly lines: readonly JournalEntryLine[];
} {
  const journalNumber = dto.journalNumber;

  return {
    entry: {
      id: dto.id,
      journalNumber: dto.journalNumber,
      statusCode: dto.statusCode,
      statusLabel: dto.statusLabel,
      sourceTypeCode: dto.sourceTypeCode,
      sourceTypeLabel: dto.sourceTypeLabel,
      sourceId: dto.sourceId,
      journalDate: parseDate(dto.journalDate, 'Journal date'),
      accountingPeriodId: dto.accountingPeriodId,
      periodCode: dto.periodCode,
      description: dto.description,
      currencyLookupValueId: dto.currencyLookupValueId,
      currencyCode: dto.currencyCode,
      currencyLabel: dto.currencyLabel,
      totalDebit: parseNumber(dto.totalDebit, 'Journal total debit'),
      totalCredit: parseNumber(dto.totalCredit, 'Journal total credit'),
      postedByEmail: dto.postedByEmail,
      postedAt: parseNullableDate(dto.postedAt, 'Journal posted date'),
      cancelledByEmail: dto.cancelledByEmail,
      cancelledAt: parseNullableDate(dto.cancelledAt, 'Journal cancelled date'),
      createdByEmail: dto.createdByEmail,
      createdAt: parseDate(dto.createdAt, 'Journal created date'),
      updatedAt: parseDate(dto.updatedAt, 'Journal updated date')
    },
    lines: dto.lines.map((line) => mapJournalEntryResponseLine(line, journalNumber))
  };
}

function mapJournalEntryResponseLine(
  line: JournalEntryResponseLineDto,
  journalNumber: string
): JournalEntryLine {
  return {
    id: line.id,
    journalEntryId: line.journalEntryId,
    journalNumber,
    lineNumber: line.lineNumber,
    accountId: line.accountId,
    accountCode: line.accountCode,
    accountName: line.accountName,
    accountTypeCode: line.accountTypeCode,
    description: line.description,
    debitAmount: parseNumber(line.debitAmount, 'Journal line debit'),
    creditAmount: parseNumber(line.creditAmount, 'Journal line credit'),
    sourceLineId: line.sourceLineId
  };
}

export function parseNumber(value: string | number, label: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} received from API is not a valid number.`);
  }

  return parsed;
}

function parseNullableDate(value: string | null, label: string): Date | null {
  return value ? parseDate(value, label) : null;
}

function parseDate(value: string, label: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} received from API is not a valid date.`);
  }

  return date;
}
