import type { FeatureFlagResponseDto } from './feature-flag-response.dto';

export interface FeatureFlagPageResponseDto {
  readonly items: readonly FeatureFlagResponseDto[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}
