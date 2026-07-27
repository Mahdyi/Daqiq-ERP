import { buildPostgrestProductListRequest } from './postgrest-product-query.util';

describe('buildPostgrestProductListRequest', () => {
  it('builds pagination, search, filters, and strict sort params', () => {
    const request = buildPostgrestProductListRequest({
      page: 2,
      pageSize: 10,
      search: 'pump',
      active: true,
      productType: 'finished_good',
      categoryLookupValueId: 'category-id',
      sortField: 'sku',
      sortDirection: 'asc'
    });

    expect(request.range).toBe('20-29');
    expect(request.params['active']).toBe('eq.true');
    expect(request.params['product_type']).toBe('eq.finished_good');
    expect(request.params['category_lookup_value_id']).toBe('eq.category-id');
    expect(request.params['order']).toBe('sku.asc,id.asc');
    expect(request.params['or']?.toString()).toContain('sku.ilike.*pump*');
  });
});
