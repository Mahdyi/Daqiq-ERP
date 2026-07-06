import { CUSTOMER_ROUTES } from './customer.routes';

describe('CUSTOMER_ROUTES', () => {
  it('protects the list route with the customer view permission', () => {
    const parent = CUSTOMER_ROUTES[0];
    const listRoute = parent.children?.find((route) => route.path === '');

    expect(listRoute?.data?.['authorization']).toEqual({
      permissions: ['customers.view']
    });
  });

  it('protects create and edit routes with write permissions', () => {
    const parent = CUSTOMER_ROUTES[0];
    const createRoute = parent.children?.find((route) => route.path === 'new');
    const editRoute = parent.children?.find((route) => route.path === ':id/edit');

    expect(createRoute?.data?.['authorization']).toEqual({
      permissions: ['customers.create']
    });
    expect(editRoute?.data?.['authorization']).toEqual({
      permissions: ['customers.update']
    });
  });
});
