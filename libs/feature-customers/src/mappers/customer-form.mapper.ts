import { CreateCustomerPostgrestRequest } from '../dto/create-customer-postgrest-request.dto';
import { UpdateCustomerPostgrestRequest } from '../dto/update-customer-postgrest-request.dto';
import { Customer } from '../models/customer.model';
import { CustomerFormValue } from '../models/customer-form-value.model';

export const DEFAULT_CUSTOMER_FORM_VALUE: CustomerFormValue = {
  code: null,
  name: null,
  email: null,
  phone: null,
  customerType: 'corporate',
  creditLimit: null,
  active: true
};

export function mapCustomerToFormValue(customer: Customer): CustomerFormValue {
  return {
    code: customer.code,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    customerType: customer.customerType,
    creditLimit: customer.creditLimit,
    active: customer.active
  };
}

export function mapFormValueToCreateRequest(
  value: Readonly<CustomerFormValue>
): CreateCustomerPostgrestRequest {
  const customerType = value.customerType ?? 'corporate';

  return {
    code: normalizeRequiredText(value.code),
    name: normalizeRequiredText(value.name),
    email: normalizeOptionalText(value.email),
    phone: normalizeOptionalText(value.phone),
    customer_type: customerType,
    credit_limit: customerType === 'corporate' ? value.creditLimit : null,
    active: value.active
  };
}

export function mapFormValueToUpdateRequest(
  value: Readonly<CustomerFormValue>
): UpdateCustomerPostgrestRequest {
  return mapFormValueToCreateRequest(value);
}

function normalizeRequiredText(value: string | null): string {
  return (value ?? '').trim();
}

function normalizeOptionalText(value: string | null): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}
