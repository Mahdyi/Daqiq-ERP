import { PRODUCT_ROUTES } from './product.routes';

describe('PRODUCT_ROUTES', () => {
  it('protects product list/create/edit routes with product permissions', () => {
    const parent = PRODUCT_ROUTES[0];
    const listRoute = parent.children?.find((route) => route.path === '');
    const createRoute = parent.children?.find((route) => route.path === 'new');
    const editRoute = parent.children?.find((route) => route.path === ':id/edit');

    expect(listRoute?.data?.['authorization']).toEqual({
      permissions: ['products.view']
    });
    expect(createRoute?.data?.['authorization']).toEqual({
      permissions: ['products.create']
    });
    expect(editRoute?.data?.['authorization']).toEqual({
      permissions: ['products.update']
    });
  });
});
