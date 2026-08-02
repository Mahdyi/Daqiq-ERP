import {
  buildOrderParam,
  buildPostgrestWarehouseIdParams,
  buildPostgrestWarehouseListRequest
} from './postgrest-warehouse-query.util';

describe('warehouse PostgREST query utilities', () => {
  it('builds pagination range and safe search params', () => {
    const request = buildPostgrestWarehouseListRequest({
      page: 2,
      pageSize: 10,
      search: ' MAIN ',
      active: true,
      warehouseTypeLookupValueId: 'type-1',
      sortField: 'code',
      sortDirection: 'asc'
    });

    expect(request.range).toBe('20-29');
    expect(request.params['active']).toBe('eq.true');
    expect(request.params['warehouse_type_lookup_value_id']).toBe('eq.type-1');
    expect(request.params['order']).toBe('code.asc,id.asc');
    expect(request.params['or']).toContain('code.ilike.*MAIN*');
  });

  it('whitelists order fields', () => {
    expect(buildOrderParam({ sortField: 'responsiblePerson', sortDirection: 'desc' })).toBe(
      'responsible_person.desc,id.asc'
    );
  });

  it('rejects invalid UUID id filters', () => {
    expect(() => buildPostgrestWarehouseIdParams('not-a-uuid')).toThrow();
  });
});
