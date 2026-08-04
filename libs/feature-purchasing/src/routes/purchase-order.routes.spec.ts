import { PURCHASE_ORDER_ROUTES } from './purchase-order.routes';

describe('PURCHASE_ORDER_ROUTES', () => {
  it('protects purchase-order routes with purchasing permissions', () => {
    const children = PURCHASE_ORDER_ROUTES[0]?.children ?? [];

    expect(children.at(0)?.data?.['authorization']).toEqual({
      permissions: ['purchasing.view']
    });
    expect(children.at(1)?.data?.['authorization']).toEqual({
      permissions: ['purchasing.create']
    });
    expect(children.at(2)?.data?.['authorization']).toEqual({
      permissions: ['purchasing.view']
    });
    expect(children.at(3)?.data?.['authorization']).toEqual({
      permissions: ['purchasing.update']
    });
  });
});
