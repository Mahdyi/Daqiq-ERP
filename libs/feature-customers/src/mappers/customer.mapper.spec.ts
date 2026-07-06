import { mapCustomerPostgrestRow } from './customer.mapper';

describe('mapCustomerPostgrestRow', () => {
  it('maps numeric strings safely', () => {
    const customer = mapCustomerPostgrestRow({
      id: '10000000-0000-4000-8000-000000000001',
      code: 'CUST-1',
      name: 'Customer',
      email: null,
      phone: null,
      customer_type: 'corporate',
      credit_limit: '1200.50',
      active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    });

    expect(customer.creditLimit).toBe(1200.5);
  });

  it('rejects invalid numeric strings', () => {
    expect(() =>
      mapCustomerPostgrestRow({
        id: '10000000-0000-4000-8000-000000000001',
        code: 'CUST-1',
        name: 'Customer',
        email: null,
        phone: null,
        customer_type: 'corporate',
        credit_limit: 'bad',
        active: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z'
      })
    ).toThrowError();
  });
});
