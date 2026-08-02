import type { CreateSupplierPostgrestRequest } from '../dto/create-supplier-postgrest-request.dto';
import type { UpdateSupplierPostgrestRequest } from '../dto/update-supplier-postgrest-request.dto';
import type { SupplierFormValue } from '../models/supplier-form-value.model';
import type { Supplier } from '../models/supplier.model';

export const DEFAULT_SUPPLIER_FORM_VALUE: SupplierFormValue = {
  code: null,
  name: null,
  email: null,
  phone: null,
  taxNumber: null,
  contactPerson: null,
  website: null,
  address: null,
  supplierGroupLookupValueId: null,
  currencyLookupValueId: null,
  paymentTermsDays: null,
  active: true
};

export function mapSupplierToFormValue(supplier: Supplier): SupplierFormValue {
  return {
    code: supplier.code,
    name: supplier.name,
    email: supplier.email,
    phone: supplier.phone,
    taxNumber: supplier.taxNumber,
    contactPerson: supplier.contactPerson,
    website: supplier.website,
    address: supplier.address,
    supplierGroupLookupValueId: supplier.supplierGroupLookupValueId,
    currencyLookupValueId: supplier.currencyLookupValueId,
    paymentTermsDays: supplier.paymentTermsDays,
    active: supplier.active
  };
}

export function mapFormValueToCreateSupplierRequest(
  value: Readonly<SupplierFormValue>
): CreateSupplierPostgrestRequest {
  return {
    code: requiredText(value.code),
    name: requiredText(value.name),
    email: optionalText(value.email),
    phone: optionalText(value.phone),
    tax_number: optionalText(value.taxNumber),
    contact_person: optionalText(value.contactPerson),
    website: optionalText(value.website),
    address: optionalText(value.address),
    supplier_group_lookup_value_id: value.supplierGroupLookupValueId,
    currency_lookup_value_id: value.currencyLookupValueId,
    payment_terms_days: value.paymentTermsDays,
    active: value.active
  };
}

export function mapFormValueToUpdateSupplierRequest(
  value: Readonly<SupplierFormValue>
): UpdateSupplierPostgrestRequest {
  return mapFormValueToCreateSupplierRequest(value);
}

function requiredText(value: string | null): string {
  return (value ?? '').trim();
}

function optionalText(value: string | null): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}
