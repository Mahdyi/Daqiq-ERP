import {
  buildPostgrestSupplierIdParams,
  buildPostgrestSupplierListRequest,
  escapePostgrestIlikeTerm
} from './postgrest-supplier-query.util';

describe('postgrest supplier query utilities', () => {
  it('builds paged, filtered supplier requests', () => {
    const request = buildPostgrestSupplierListRequest({
      page: 2,
      pageSize: 25,
      search: 'sup,one',
      active: true,
      supplierGroupLookupValueId: 'group-id',
      currencyLookupValueId: 'currency-id',
      sortField: 'name',
      sortDirection: 'asc'
    });

    expect(request.range).toBe('50-74');
    expect(request.params['active']).toBe('eq.true');
    expect(request.params['supplier_group_lookup_value_id']).toBe('eq.group-id');
    expect(request.params['currency_lookup_value_id']).toBe('eq.currency-id');
    expect(request.params['order']).toBe('name.asc,id.asc');
    expect(request.params['or']).toContain('code.ilike.*sup\\,one*');
  });

  it('escapes PostgREST ilike metacharacters', () => {
    expect(escapePostgrestIlikeTerm('a%b,c(*)')).toBe('a\\%b\\,c\\(\\*\\)');
  });

  it('requires valid UUID ids', () => {
    expect(() => buildPostgrestSupplierIdParams('not-a-uuid')).toThrow();
  });
});
