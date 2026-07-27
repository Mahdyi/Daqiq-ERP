import type { ApiPage } from '@daqiq/core';

import type { FeatureFlagPageResponseDto } from '../dto/feature-flag-page-response.dto';
import type { FeatureFlagResponseDto } from '../dto/feature-flag-response.dto';
import type { FeatureFlag } from '../models/feature-flag.model';

export function mapFeatureFlagResponseDto(dto: FeatureFlagResponseDto): FeatureFlag {
  return {
    id: dto.id,
    flagKey: dto.flagKey,
    enabled: dto.enabled,
    label: dto.label,
    description: dto.description,
    category: dto.category,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt)
  };
}

export function mapFeatureFlagPageResponseDto(
  dto: FeatureFlagPageResponseDto
): ApiPage<FeatureFlag> {
  return {
    items: dto.items.map(mapFeatureFlagResponseDto),
    page: dto.page - 1,
    pageSize: dto.pageSize,
    totalItems: dto.totalItems,
    totalPages: dto.totalPages
  };
}
