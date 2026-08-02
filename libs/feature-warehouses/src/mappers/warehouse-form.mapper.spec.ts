import {
  mapFormValueToCreateWarehouseRequest,
  optionalText,
  requiredText
} from './warehouse-form.mapper';

describe('warehouse form mapper', () => {
  it('trims required text and normalizes blank optional text to null', () => {
    const request = mapFormValueToCreateWarehouseRequest({
      code: ' WH-1 ',
      name: ' Main ',
      description: ' ',
      warehouseTypeLookupValueId: null,
      address: '',
      responsiblePerson: ' Sara ',
      phone: null,
      email: ' ops@example.test ',
      active: true
    });

    expect(request).toEqual({
      code: 'WH-1',
      name: 'Main',
      description: null,
      warehouse_type_lookup_value_id: null,
      address: null,
      responsible_person: 'Sara',
      phone: null,
      email: 'ops@example.test',
      active: true
    });
  });

  it('keeps required and optional helpers deterministic', () => {
    expect(requiredText(null)).toBe('');
    expect(optionalText('   ')).toBeNull();
    expect(optionalText(' value ')).toBe('value');
  });
});
