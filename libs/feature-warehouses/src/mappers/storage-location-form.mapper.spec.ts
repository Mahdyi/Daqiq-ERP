import { mapFormValueToCreateStorageLocationRequest } from './storage-location-form.mapper';

describe('storage location form mapper', () => {
  it('maps form values to snake_case PostgREST payloads', () => {
    expect(
      mapFormValueToCreateStorageLocationRequest({
        warehouseId: ' warehouse-id ',
        code: ' A-01 ',
        name: ' Shelf A ',
        description: ' ',
        locationTypeLookupValueId: null,
        parentLocationId: 'parent-id',
        active: true
      })
    ).toEqual({
      warehouse_id: 'warehouse-id',
      code: 'A-01',
      name: 'Shelf A',
      description: null,
      location_type_lookup_value_id: null,
      parent_location_id: 'parent-id',
      active: true
    });
  });
});
