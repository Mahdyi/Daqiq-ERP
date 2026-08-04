import {
  mapFormToCreatePurchaseOrderRequest
} from './purchase-order-form.mapper';

describe('purchase order form mapper', () => {
  it('maps header and lines to RPC snake_case request payload', () => {
    const request = mapFormToCreatePurchaseOrderRequest(
      {
        supplierId: '11111111-1111-4111-8111-111111111111',
        orderDate: new Date('2026-08-04T00:00:00.000Z'),
        expectedDate: null,
        currencyLookupValueId: '22222222-2222-4222-8222-222222222222',
        deliveryWarehouseId: null,
        notes: '  test  '
      },
      [
        {
          clientId: 'line-1',
          productId: '33333333-3333-4333-8333-333333333333',
          description: '',
          quantity: 2,
          unitLookupValueId: '44444444-4444-4444-8444-444444444444',
          unitPrice: 10,
          taxRateLookupValueId: null
        }
      ]
    );

    expect(request.order_date).toBe('2026-08-04');
    expect(request.notes).toBe('test');
    expect(request.lines[0]?.product_id).toBe('33333333-3333-4333-8333-333333333333');
    expect(request.lines[0]?.description).toBeNull();
  });

  it('rejects orders without lines', () => {
    expect(() =>
      mapFormToCreatePurchaseOrderRequest(
        {
          supplierId: '11111111-1111-4111-8111-111111111111',
          orderDate: new Date('2026-08-04T00:00:00.000Z'),
          expectedDate: null,
          currencyLookupValueId: null,
          deliveryWarehouseId: null,
          notes: null
        },
        []
      )
    ).toThrow();
  });
});
