export interface CreateStorageLocationPostgrestRequest {
  readonly warehouse_id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly location_type_lookup_value_id: string | null;
  readonly parent_location_id: string | null;
  readonly active: boolean;
}
