export interface StorageLocationPostgrestRow {
  readonly id: string;
  readonly warehouse_id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly location_type_lookup_value_id: string | null;
  readonly parent_location_id: string | null;
  readonly active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}
