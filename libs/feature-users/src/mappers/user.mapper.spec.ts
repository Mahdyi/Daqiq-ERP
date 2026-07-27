import { UserAdminResponseDto } from '../dto/user-admin-response.dto';
import { UserPageResponseDto } from '../dto/user-page-response.dto';
import { mapUserPageResponseDto, mapUserResponseDto } from './user.mapper';

const USER_RESPONSE: UserAdminResponseDto = {
  id: '00000000-0000-4000-8000-000000000020',
  email: 'admin@erp.com',
  displayName: 'مدیر سیستم',
  active: true,
  roles: ['admin', 'unknown-role'],
  createdAt: '2026-07-27T10:00:00.000Z',
  updatedAt: '2026-07-27T11:00:00.000Z',
  lastLoginAt: null
};

describe('user mapper', () => {
  it('maps safe user DTOs and ignores unknown roles', () => {
    const user = mapUserResponseDto(USER_RESPONSE);

    expect(user.id).toBe(USER_RESPONSE.id);
    expect(user.email).toBe(USER_RESPONSE.email);
    expect(user.roles).toEqual(['admin']);
    expect(user.createdAt instanceof Date).toBeTrue();
    expect(user.lastLoginAt).toBeNull();
  });

  it('maps the admin RPC page response to the shared ApiPage shape', () => {
    const response: UserPageResponseDto = {
      items: [USER_RESPONSE],
      page: 2,
      pageSize: 20,
      totalItems: 25,
      totalPages: 2
    };

    const page = mapUserPageResponseDto(response);

    expect(page.page).toBe(1);
    expect(page.pageSize).toBe(20);
    expect(page.totalItems).toBe(25);
    expect(page.items.length).toBe(1);
  });
});
