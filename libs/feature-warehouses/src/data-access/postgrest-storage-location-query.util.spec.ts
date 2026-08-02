import {
  buildOrderParam,
  buildPostgrestStorageLocationIdParams,
  buildPostgrestStorageLocationListRequest
} from './postgrest-storage-location-query.util';

describe('storage location PostgREST query utilities', () => {
  it('builds filtering params for storage locations', () => {
    const request = buildPostgrestStorageLocationListRequest({
      page: 1,
      pageSize: 25,
      search: 'A-01',
      active: false,
      warehouseId: 'warehouse-1',
      locationTypeLookupValueId: 'type-1',
      parentLocationId: 'parent-1',
      sortField: 'warehouseId',
      sortDirection: 'asc'
    });

    expect(request.range).toBe('25-49');
    expect(request.params['active']).toBe('eq.false');
    expect(request.params['warehouse_id']).toBe('eq.warehouse-1');
    expect(request.params['location_type_lookup_value_id']).toBe('eq.type-1');
    expect(request.params['parent_location_id']).toBe('eq.parent-1');
    expect(request.params['order']).toBe('warehouse_id.asc,id.asc');
    expect(request.params['or']).toContain('code.ilike.*A-01*');
  });

  it('whitelists order fields', () => {
    expect(buildOrderParam({ sortField: 'parentLocationId', sortDirection: 'desc' })).toBe(
      'parent_location_id.desc,id.asc'
    );
  });

  it('rejects invalid UUID id filters', () => {
    expect(() => buildPostgrestStorageLocationIdParams('not-a-uuid')).toThrow();
  });
});
