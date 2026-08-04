import { SALES_ROUTES } from './sales-order.routes';

describe('SALES_ROUTES', () => {
  it('protects sales-order routes with sales-order permissions', () => {
    const children = SALES_ROUTES[0]?.children ?? [];

    expect(children.find((route) => route.path === 'sales-orders')?.data?.['authorization'])
      .toEqual({ permissions: ['salesOrders.view'] });
    expect(children.find((route) => route.path === 'sales-orders/new')?.data?.['authorization'])
      .toEqual({ permissions: ['salesOrders.create'] });
    expect(children.find((route) => route.path === 'sales-orders/:id')?.data?.['authorization'])
      .toEqual({ permissions: ['salesOrders.view'] });
    expect(children.find((route) => route.path === 'sales-orders/:id/edit')?.data?.['authorization'])
      .toEqual({ permissions: ['salesOrders.update'] });
  });
});
