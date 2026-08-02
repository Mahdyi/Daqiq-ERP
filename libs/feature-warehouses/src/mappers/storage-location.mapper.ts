import { parseDate } from './warehouse.mapper';
import type { StorageLocationPostgrestRow } from '../dto/storage-location-postgrest-row.dto';
import type { StorageLocation } from '../models/storage-location.model';

export function mapStorageLocationPostgrestRow(
  row: StorageLocationPostgrestRow
): StorageLocation {
  return {
    id: row.id,
    warehouseId: row.warehouse_id,
    code: row.code,
    name: row.name,
    description: row.description,
    locationTypeLookupValueId: row.location_type_lookup_value_id,
    parentLocationId: row.parent_location_id,
    active: row.active,
    createdAt: parseDate(row.created_at, 'created_at'),
    updatedAt: parseDate(row.updated_at, 'updated_at')
  };
}
