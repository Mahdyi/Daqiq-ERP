import { PURCHASE_ORDER_ROUTES, PURCHASING_ROUTES } from './purchase-order.routes';

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
    expect(children.at(4)?.data?.['authorization']).toEqual({
      permissions: ['receiving.post']
    });
  });

  it('exposes receiving routes with receiving permissions', () => {
    const children = PURCHASING_ROUTES[0]?.children ?? [];
    const receiveRoute = children.find((route) => route.path === 'purchase-orders/:id/receive');
    const receiptListRoute = children.find((route) => route.path === 'goods-receipts');
    const receiptDetailRoute = children.find((route) => route.path === 'goods-receipts/:id');

    expect(receiveRoute?.data?.['authorization']).toEqual({
      permissions: ['receiving.post']
    });
    expect(receiptListRoute?.data?.['authorization']).toEqual({
      permissions: ['receiving.view']
    });
    expect(receiptDetailRoute?.data?.['authorization']).toEqual({
      permissions: ['receiving.view']
    });
  });
});
