export interface SupplierPostgrestRow {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly tax_number: string | null;
  readonly contact_person: string | null;
  readonly website: string | null;
  readonly address: string | null;
  readonly supplier_group_lookup_value_id: string | null;
  readonly currency_lookup_value_id: string | null;
  readonly payment_terms_days: number | null;
  readonly active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}
