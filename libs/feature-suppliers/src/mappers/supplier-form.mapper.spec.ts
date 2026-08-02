import { mapFormValueToCreateSupplierRequest } from './supplier-form.mapper';

describe('supplier form mapper', () => {
  it('trims required text and normalizes blank optional fields to null', () => {
    const request = mapFormValueToCreateSupplierRequest({
      code: ' SUP-1 ',
      name: ' Supplier ',
      email: ' ',
      phone: '',
      taxNumber: null,
      contactPerson: ' Contact ',
      website: '',
      address: ' Address ',
      supplierGroupLookupValueId: 'group-id',
      currencyLookupValueId: 'currency-id',
      paymentTermsDays: 30,
      active: true
    });

    expect(request.code).toBe('SUP-1');
    expect(request.name).toBe('Supplier');
    expect(request.email).toBeNull();
    expect(request.phone).toBeNull();
    expect(request.contact_person).toBe('Contact');
    expect(request.address).toBe('Address');
  });
});
