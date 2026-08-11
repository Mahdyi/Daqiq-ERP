export interface CashBankAccount {
  readonly id: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountTypeLookupValueId: string;
  readonly accountTypeCode: string;
  readonly accountTypeLabel: string;
  readonly currencyLookupValueId: string | null;
  readonly currencyCode: string | null;
  readonly currencyLabel: string | null;
  readonly glAccountId: string;
  readonly glAccountCode: string;
  readonly glAccountName: string;
  readonly bankName: string | null;
  readonly iban: string | null;
  readonly accountNumber: string | null;
  readonly description: string | null;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
