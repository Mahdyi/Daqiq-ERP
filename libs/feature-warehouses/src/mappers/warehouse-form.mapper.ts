import type { CreateWarehousePostgrestRequest } from '../dto/create-warehouse-postgrest-request.dto';
import type { UpdateWarehousePostgrestRequest } from '../dto/update-warehouse-postgrest-request.dto';
import type { WarehouseFormValue } from '../models/warehouse-form-value.model';
import type { Warehouse } from '../models/warehouse.model';

export const DEFAULT_WAREHOUSE_FORM_VALUE: WarehouseFormValue = {
  code: null,
  name: null,
  description: null,
  warehouseTypeLookupValueId: null,
  address: null,
  responsiblePerson: null,
  phone: null,
  email: null,
  active: true
};

export function mapWarehouseToFormValue(warehouse: Warehouse): WarehouseFormValue {
  return {
    code: warehouse.code,
    name: warehouse.name,
    description: warehouse.description,
    warehouseTypeLookupValueId: warehouse.warehouseTypeLookupValueId,
    address: warehouse.address,
    responsiblePerson: warehouse.responsiblePerson,
    phone: warehouse.phone,
    email: warehouse.email,
    active: warehouse.active
  };
}

export function mapFormValueToCreateWarehouseRequest(
  value: Readonly<WarehouseFormValue>
): CreateWarehousePostgrestRequest {
  return {
    code: requiredText(value.code),
    name: requiredText(value.name),
    description: optionalText(value.description),
    warehouse_type_lookup_value_id: value.warehouseTypeLookupValueId,
    address: optionalText(value.address),
    responsible_person: optionalText(value.responsiblePerson),
    phone: optionalText(value.phone),
    email: optionalText(value.email),
    active: value.active
  };
}

export function mapFormValueToUpdateWarehouseRequest(
  value: Readonly<WarehouseFormValue>
): UpdateWarehousePostgrestRequest {
  return mapFormValueToCreateWarehouseRequest(value);
}

export function requiredText(value: string | null): string {
  return (value ?? '').trim();
}

export function optionalText(value: string | null): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}
