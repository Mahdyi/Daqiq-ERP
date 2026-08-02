export interface SupplierFormValue {
  readonly code: string | null;
  readonly name: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly taxNumber: string | null;
  readonly contactPerson: string | null;
  readonly website: string | null;
  readonly address: string | null;
  readonly supplierGroupLookupValueId: string | null;
  readonly currencyLookupValueId: string | null;
  readonly paymentTermsDays: number | null;
  readonly active: boolean;
}
