import { USER_ROUTES } from './user.routes';

describe('USER_ROUTES', () => {
  it('protects user management routes with typed permissions', () => {
    const root = USER_ROUTES[0];
    const children = root.children ?? [];
    const listRoute = children.find((route) => route.path === '');
    const newRoute = children.find((route) => route.path === 'new');
    const editRoute = children.find((route) => route.path === ':id/edit');
    const resetRoute = children.find((route) => route.path === ':id/reset-password');

    expect(listRoute?.data?.['authorization']).toEqual({
      permissions: ['users.view']
    });
    expect(newRoute?.data?.['authorization']).toEqual({
      permissions: ['users.create']
    });
    expect(editRoute?.data?.['authorization']).toEqual({
      permissions: ['users.update']
    });
    expect(resetRoute?.data?.['authorization']).toEqual({
      permissions: ['users.update']
    });
  });
});
