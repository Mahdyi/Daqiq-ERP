import { mapProductPostgrestRow } from './product.mapper';

describe('product mapper', () => {
  it('maps numeric strings and dates safely', () => {
    const product = mapProductPostgrestRow({
      id: 'product-id',
      sku: 'PRD-1',
      name: 'Product',
      description: null,
      barcode: null,
      product_type: 'finished_good',
      category_lookup_value_id: null,
      base_unit_lookup_value_id: 'unit-id',
      tax_rate_lookup_value_id: null,
      track_inventory: true,
      purchasable: true,
      sellable: true,
      standard_cost: '12.50',
      sales_price: '20.00',
      active: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z'
    });

    expect(product.standardCost).toBe(12.5);
    expect(product.salesPrice).toBe(20);
    expect(product.createdAt instanceof Date).toBeTrue();
  });

  it('rejects invalid numeric values', () => {
    expect(() =>
      mapProductPostgrestRow({
        id: 'product-id',
        sku: 'PRD-1',
        name: 'Product',
        description: null,
        barcode: null,
        product_type: 'finished_good',
        category_lookup_value_id: null,
        base_unit_lookup_value_id: 'unit-id',
        tax_rate_lookup_value_id: null,
        track_inventory: true,
        purchasable: true,
        sellable: true,
        standard_cost: 'not-number',
        sales_price: null,
        active: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z'
      })
    ).toThrow();
  });
});
