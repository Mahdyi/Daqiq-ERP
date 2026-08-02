export interface WarehousePostgrestRow {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly warehouse_type_lookup_value_id: string | null;
  readonly address: string | null;
  readonly responsible_person: string | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}
