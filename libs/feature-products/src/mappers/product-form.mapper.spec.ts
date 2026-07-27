import { mapFormValueToCreateProductRequest } from './product-form.mapper';

describe('product form mapper', () => {
  it('forces service products to disable inventory tracking', () => {
    const request = mapFormValueToCreateProductRequest({
      sku: 'SRV-1',
      name: 'Service',
      description: null,
      barcode: null,
      productType: 'service',
      categoryLookupValueId: null,
      baseUnitLookupValueId: 'unit-id',
      taxRateLookupValueId: null,
      trackInventory: true,
      purchasable: false,
      sellable: true,
      standardCost: null,
      salesPrice: 100,
      active: true
    });

    expect(request.track_inventory).toBeFalse();
  });
});
