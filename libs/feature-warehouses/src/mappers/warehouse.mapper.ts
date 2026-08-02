import { ApiError } from '@daqiq/core';

import type { WarehousePostgrestRow } from '../dto/warehouse-postgrest-row.dto';
import type { Warehouse } from '../models/warehouse.model';

export function mapWarehousePostgrestRow(row: WarehousePostgrestRow): Warehouse {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    warehouseTypeLookupValueId: row.warehouse_type_lookup_value_id,
    address: row.address,
    responsiblePerson: row.responsible_person,
    phone: row.phone,
    email: row.email,
    active: row.active,
    createdAt: parseDate(row.created_at, 'created_at'),
    updatedAt: parseDate(row.updated_at, 'updated_at')
  };
}

export function parseDate(value: string, field: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError({
      status: 0,
      code: 'UNKNOWN',
      message: `Invalid date value for ${field}.`,
      fieldErrors: []
    });
  }

  return date;
}
