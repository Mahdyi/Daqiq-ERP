import {
  buildSalesOrderIdParams,
  buildSalesOrderListRequest
} from './postgrest-sales-order-query.util';

describe('sales order PostgREST query utilities', () => {
  it('builds search, paging, and sorting params safely', () => {
    const request = buildSalesOrderListRequest({
      page: 2,
      pageSize: 10,
      search: 'SO,100',
      statusCode: 'draft',
      sortField: 'customerName',
      sortDirection: 'asc'
    });

    expect(request.range).toBe('20-29');
    expect(request.params['status_code']).toBe('eq.draft');
    expect(request.params['order']).toBe('customer_name.asc,id.desc');
    expect(String(request.params['or'])).toContain('SO\\,100');
  });

  it('rejects invalid sales-order ids', () => {
    expect(() => buildSalesOrderIdParams('bad-id')).toThrow();
  });
});

