import { mapSupplierPostgrestRow } from './supplier.mapper';

describe('mapSupplierPostgrestRow', () => {
  it('maps snake_case PostgREST rows to supplier models', () => {
    const supplier = mapSupplierPostgrestRow({
      id: '11111111-1111-4111-8111-111111111111',
      code: 'SUP-1',
      name: 'Supplier',
      email: null,
      phone: '021',
      tax_number: null,
      contact_person: 'Contact',
      website: null,
      address: null,
      supplier_group_lookup_value_id: '22222222-2222-4222-8222-222222222222',
      currency_lookup_value_id: null,
      payment_terms_days: 30,
      active: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z'
    });

    expect(supplier.taxNumber).toBeNull();
    expect(supplier.contactPerson).toBe('Contact');
    expect(supplier.supplierGroupLookupValueId).toBe('22222222-2222-4222-8222-222222222222');
    expect(supplier.createdAt instanceof Date).toBeTrue();
  });
});
