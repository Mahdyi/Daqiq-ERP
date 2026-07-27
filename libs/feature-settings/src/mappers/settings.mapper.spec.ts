import { mapSystemSettingPageResponseDto } from './settings.mapper';

describe('settings mapper', () => {
  it('converts system setting dates and page index safely', () => {
    const page = mapSystemSettingPageResponseDto({
      items: [
        {
          id: 'setting-id',
          settingKey: 'company.name',
          settingValue: 'Daqiq ERP',
          valueType: 'string',
          category: 'company',
          label: 'Company name',
          description: null,
          editable: true,
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

    expect(page.page).toBe(0);
    expect(page.items[0].createdAt instanceof Date).toBeTrue();
    expect(page.items[0].settingKey).toBe('company.name');
  });
});
