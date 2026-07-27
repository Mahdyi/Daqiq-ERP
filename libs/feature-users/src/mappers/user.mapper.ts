import { ApiPage, normalizeRoles } from '@daqiq/core';

import { UserAdminResponseDto } from '../dto/user-admin-response.dto';
import { UserPageResponseDto } from '../dto/user-page-response.dto';
import { ManagedUser } from '../models/user.model';

export function mapUserResponseDto(dto: UserAdminResponseDto): ManagedUser {
  return {
    id: dto.id,
    email: dto.email,
    displayName: dto.displayName,
    active: dto.active,
    roles: normalizeRoles(dto.roles),
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    lastLoginAt: dto.lastLoginAt ? new Date(dto.lastLoginAt) : null
  };
}

export function mapUserPageResponseDto(dto: UserPageResponseDto): ApiPage<ManagedUser> {
  return {
    items: dto.items.map(mapUserResponseDto),
    page: Math.max(0, dto.page - 1),
    pageSize: dto.pageSize,
    totalItems: dto.totalItems,
    totalPages: dto.totalPages
  };
}
