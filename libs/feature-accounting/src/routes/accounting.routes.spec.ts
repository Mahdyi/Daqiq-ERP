import { ACCOUNTING_ROUTES } from './accounting.routes';

describe('ACCOUNTING_ROUTES', () => {
  it('protects chart of accounts with chartOfAccounts.view', () => {
    const route = ACCOUNTING_ROUTES[0].children?.find((item) => item.path === 'chart-of-accounts');

    expect(route?.data?.['authorization']).toEqual({
      permissions: ['chartOfAccounts.view']
    });
  });

  it('protects manual journal creation with accounting.create', () => {
    const route = ACCOUNTING_ROUTES[0].children?.find((item) => item.path === 'journal-entries/new');

    expect(route?.data?.['authorization']).toEqual({
      permissions: ['accounting.create']
    });
  });
});
