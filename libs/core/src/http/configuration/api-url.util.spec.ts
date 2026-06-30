import { joinApiUrl } from './api-url.util';

describe('joinApiUrl', () => {
  it('joins a relative base URL and endpoint without duplicate slashes', () => {
    expect(joinApiUrl('/api/', '/customers')).toBe('/api/customers');
  });

  it('supports endpoints without a leading slash', () => {
    expect(joinApiUrl('/api', 'customers/1')).toBe('/api/customers/1');
  });

  it('rejects an empty endpoint', () => {
    expect(() => joinApiUrl('/api', '   ')).toThrowError('API endpoint must not be empty.');
  });
});
