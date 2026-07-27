import { AUDIT_LOG_ROUTES } from './audit-log.routes';

describe('AUDIT_LOG_ROUTES', () => {
  it('protects audit routes with audit.view', () => {
    const children = AUDIT_LOG_ROUTES[0].children ?? [];
    const listRoute = children.find((route) => route.path === '');
    const detailRoute = children.find((route) => route.path === ':id');

    expect(listRoute?.data?.['authorization']).toEqual({
      permissions: ['audit.view']
    });
    expect(detailRoute?.data?.['authorization']).toEqual({
      permissions: ['audit.view']
    });
  });
});
