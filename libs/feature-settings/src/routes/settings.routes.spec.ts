import { SETTINGS_ROUTES } from './settings.routes';

describe('SETTINGS_ROUTES', () => {
  it('protects settings routes with typed authorization metadata', () => {
    const paths = SETTINGS_ROUTES.map((route) => route.path);

    expect(paths).toContain('settings');
    expect(paths).toContain('lookups');
    expect(paths).toContain('feature-flags');

    const settingsRoute = SETTINGS_ROUTES.find((route) => route.path === 'settings');
    const lookupsRoute = SETTINGS_ROUTES.find((route) => route.path === 'lookups');
    const featureFlagsRoute = SETTINGS_ROUTES.find((route) => route.path === 'feature-flags');

    expect(settingsRoute?.data?.['authorization']).toEqual({
      permissions: ['settings.view']
    });
    expect(lookupsRoute?.data?.['authorization']).toEqual({
      permissions: ['lookups.view']
    });
    expect(featureFlagsRoute?.data?.['authorization']).toEqual({
      permissions: ['featureFlags.view']
    });
  });
});
