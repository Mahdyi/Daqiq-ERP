import { mapLookupValuePageResponseDto } from './lookups.mapper';

describe('lookups mapper', () => {
  it('preserves lookup metadata as typed unknown record data', () => {
    const page = mapLookupValuePageResponseDto({
      items: [
        {
          id: 'value-id',
          lookupTypeId: 'type-id',
          lookupTypeCode: 'unit',
          code: 'kg',
          label: 'کیلوگرم',
          description: null,
          sortOrder: 1,
          metadata: { source: 'seed' },
          system: true,
          active: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z'
        }
      ],
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1
    });

    expect(page.items[0].metadata['source']).toBe('seed');
    expect(page.items[0].lookupTypeCode).toBe('unit');
  });
});
