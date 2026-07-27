import type { ApiPage } from '@daqiq/core';

import type { LookupTypePageResponseDto } from '../dto/lookup-type-page-response.dto';
import type { LookupTypeResponseDto } from '../dto/lookup-type-response.dto';
import type { LookupValuePageResponseDto } from '../dto/lookup-value-page-response.dto';
import type { LookupValueResponseDto } from '../dto/lookup-value-response.dto';
import type { LookupType } from '../models/lookup-type.model';
import type { LookupValue } from '../models/lookup-value.model';

export function mapLookupTypeResponseDto(dto: LookupTypeResponseDto): LookupType {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    description: dto.description,
    system: dto.system,
    active: dto.active,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt)
  };
}

export function mapLookupTypePageResponseDto(
  dto: LookupTypePageResponseDto
): ApiPage<LookupType> {
  return {
    items: dto.items.map(mapLookupTypeResponseDto),
    page: dto.page - 1,
    pageSize: dto.pageSize,
    totalItems: dto.totalItems,
    totalPages: dto.totalPages
  };
}

export function mapLookupValueResponseDto(dto: LookupValueResponseDto): LookupValue {
  return {
    id: dto.id,
    lookupTypeId: dto.lookupTypeId,
    lookupTypeCode: dto.lookupTypeCode,
    code: dto.code,
    label: dto.label,
    description: dto.description,
    sortOrder: dto.sortOrder,
    metadata: dto.metadata,
    system: dto.system,
    active: dto.active,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt)
  };
}

export function mapLookupValuePageResponseDto(
  dto: LookupValuePageResponseDto
): ApiPage<LookupValue> {
  return {
    items: dto.items.map(mapLookupValueResponseDto),
    page: dto.page - 1,
    pageSize: dto.pageSize,
    totalItems: dto.totalItems,
    totalPages: dto.totalPages
  };
}
