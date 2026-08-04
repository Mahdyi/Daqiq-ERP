import {
  buildPurchaseOrderIdParams,
  buildPurchaseOrderListRequest
} from './postgrest-purchase-order-query.util';

describe('purchase order PostgREST query utilities', () => {
  it('builds search, paging, and sorting params safely', () => {
    const request = buildPurchaseOrderListRequest({
      page: 2,
      pageSize: 10,
      search: 'PO,100',
      statusCode: 'draft',
      sortField: 'supplierName',
      sortDirection: 'asc'
    });

    expect(request.range).toBe('20-29');
    expect(request.params['status_code']).toBe('eq.draft');
    expect(request.params['order']).toBe('supplier_name.asc,id.desc');
    expect(String(request.params['or'])).toContain('PO\\,100');
  });

  it('rejects invalid purchase-order ids', () => {
    expect(() => buildPurchaseOrderIdParams('bad-id')).toThrow();
  });
});
