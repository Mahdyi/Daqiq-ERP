export type GlAccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface GlAccount {
  readonly id: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountTypeLookupValueId: string;
  readonly accountTypeCode: GlAccountType;
  readonly accountTypeLabel: string;
  readonly parentAccountId: string | null;
  readonly parentAccountCode: string | null;
  readonly parentAccountName: string | null;
  readonly description: string | null;
  readonly isPostable: boolean;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
