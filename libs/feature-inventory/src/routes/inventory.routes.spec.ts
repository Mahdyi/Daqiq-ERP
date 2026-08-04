import { INVENTORY_ROUTES } from './inventory.routes';

describe('INVENTORY_ROUTES', () => {
  it('protects inventory routes with typed permissions', () => {
    const children = INVENTORY_ROUTES[0].children ?? [];
    const balances = children.find((route) => route.path === 'balances');
    const movements = children.find((route) => route.path === 'movements');
    const adjustment = children.find((route) => route.path === 'adjustment');
    const transfer = children.find((route) => route.path === 'transfer');

    expect(balances?.data?.['authorization']).toEqual({ permissions: ['inventory.view'] });
    expect(movements?.data?.['authorization']).toEqual({ permissions: ['inventory.view'] });
    expect(adjustment?.data?.['authorization']).toEqual({ permissions: ['inventory.adjust'] });
    expect(transfer?.data?.['authorization']).toEqual({ permissions: ['inventory.transfer'] });
  });
});
