import { SUPPLIER_ROUTES } from './supplier.routes';

describe('SUPPLIER_ROUTES', () => {
  it('protects supplier routes with supplier permissions', () => {
    const children = SUPPLIER_ROUTES[0].children ?? [];
    const listRoute = children.find((route) => route.path === '');
    const createRoute = children.find((route) => route.path === 'new');
    const editRoute = children.find((route) => route.path === ':id/edit');

    expect(listRoute?.data?.['authorization']).toEqual({
      permissions: ['suppliers.view']
    });
    expect(createRoute?.data?.['authorization']).toEqual({
      permissions: ['suppliers.create']
    });
    expect(editRoute?.data?.['authorization']).toEqual({
      permissions: ['suppliers.update']
    });
  });
});
