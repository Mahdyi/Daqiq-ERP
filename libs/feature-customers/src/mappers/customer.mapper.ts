import { ApiError } from '@daqiq/core';

import { CustomerPostgrestRow } from '../dto/customer-postgrest-row.dto';
import { Customer } from '../models/customer.model';

export function mapCustomerPostgrestRow(row: CustomerPostgrestRow): Customer {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    email: row.email,
    phone: row.phone,
    customerType: row.customer_type,
    creditLimit: parseNullableNumeric(row.credit_limit),
    active: row.active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

function parseNullableNumeric(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim())) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  throw new ApiError({
    status: 0,
    code: 'UNKNOWN',
    message: 'مقدار عددی دریافتی از سرور معتبر نیست.',
    fieldErrors: []
  });
}
