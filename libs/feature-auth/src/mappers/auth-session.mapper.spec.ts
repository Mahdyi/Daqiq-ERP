import { mapLoginResponseToAuthSession } from './auth-session.mapper';

describe('mapLoginResponseToAuthSession', () => {
  it('maps real login responses and ignores unknown roles', () => {
    const session = mapLoginResponseToAuthSession({
      accessToken: 'opaque-test-access-value',
      tokenType: 'Bearer',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: {
        id: '1',
        email: 'admin@erp.com',
        displayName: 'Admin',
        roles: ['admin', 'erp_admin', 'unknown-role']
      }
    });

    expect(session.token.accessToken).toBe('opaque-test-access-value');
    expect(session.token.expiresAt).toBe('2099-01-01T00:00:00.000Z');
    expect(session.user.username).toBe('admin@erp.com');
    expect(session.user.roles.map((role) => role.code)).toEqual(['admin']);
  });
});
