import type { CreateStorageLocationPostgrestRequest } from '../dto/create-storage-location-postgrest-request.dto';
import type { UpdateStorageLocationPostgrestRequest } from '../dto/update-storage-location-postgrest-request.dto';
import type { StorageLocationFormValue } from '../models/storage-location-form-value.model';
import type { StorageLocation } from '../models/storage-location.model';
import { optionalText, requiredText } from './warehouse-form.mapper';

export const DEFAULT_STORAGE_LOCATION_FORM_VALUE: StorageLocationFormValue = {
  warehouseId: null,
  code: null,
  name: null,
  description: null,
  locationTypeLookupValueId: null,
  parentLocationId: null,
  active: true
};

export function mapStorageLocationToFormValue(
  location: StorageLocation
): StorageLocationFormValue {
  return {
    warehouseId: location.warehouseId,
    code: location.code,
    name: location.name,
    description: location.description,
    locationTypeLookupValueId: location.locationTypeLookupValueId,
    parentLocationId: location.parentLocationId,
    active: location.active
  };
}

export function mapFormValueToCreateStorageLocationRequest(
  value: Readonly<StorageLocationFormValue>
): CreateStorageLocationPostgrestRequest {
  return {
    warehouse_id: requiredText(value.warehouseId),
    code: requiredText(value.code),
    name: requiredText(value.name),
    description: optionalText(value.description),
    location_type_lookup_value_id: value.locationTypeLookupValueId,
    parent_location_id: value.parentLocationId,
    active: value.active
  };
}

export function mapFormValueToUpdateStorageLocationRequest(
  value: Readonly<StorageLocationFormValue>
): UpdateStorageLocationPostgrestRequest {
  return mapFormValueToCreateStorageLocationRequest(value);
}
