import { REPORT_ROUTES } from './reports.routes';

describe('REPORT_ROUTES', () => {
  it('protects report routes with report permissions', () => {
    const routePermissions = REPORT_ROUTES[0].children?.map(
      (route) => route.data?.['authorization']?.permissions?.[0]
    );

    expect(routePermissions).toEqual([
      'reports.view',
      'reports.inventory.view',
      'reports.purchasing.view',
      'reports.sales.view',
      'reports.accounting.view',
      'reports.payments.view',
      'reports.audit.view'
    ]);
  });
});
