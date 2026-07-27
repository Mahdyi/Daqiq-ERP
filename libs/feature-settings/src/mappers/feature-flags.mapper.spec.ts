import { mapFeatureFlagPageResponseDto } from './feature-flags.mapper';

describe('feature flags mapper', () => {
  it('maps feature flags without changing enabled state', () => {
    const page = mapFeatureFlagPageResponseDto({
      items: [
        {
          id: 'flag-id',
          flagKey: 'customers.enabled',
          enabled: true,
          label: 'Customers',
          description: null,
          category: 'master-data',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z'
        }
      ],
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1
    });

    expect(page.items[0].enabled).toBeTrue();
    expect(page.items[0].flagKey).toBe('customers.enabled');
  });
});
