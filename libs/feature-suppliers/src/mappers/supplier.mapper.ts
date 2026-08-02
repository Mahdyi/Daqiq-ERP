import { ApiError } from '@daqiq/core';

import type { SupplierPostgrestRow } from '../dto/supplier-postgrest-row.dto';
import type { Supplier } from '../models/supplier.model';

export function mapSupplierPostgrestRow(row: SupplierPostgrestRow): Supplier {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    email: row.email,
    phone: row.phone,
    taxNumber: row.tax_number,
    contactPerson: row.contact_person,
    website: row.website,
    address: row.address,
    supplierGroupLookupValueId: row.supplier_group_lookup_value_id,
    currencyLookupValueId: row.currency_lookup_value_id,
    paymentTermsDays: row.payment_terms_days,
    active: row.active,
    createdAt: parseDate(row.created_at, 'created_at'),
    updatedAt: parseDate(row.updated_at, 'updated_at')
  };
}

function parseDate(value: string, field: string): Date {
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
