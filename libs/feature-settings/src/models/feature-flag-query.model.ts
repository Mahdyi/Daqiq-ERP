import type { ApiQuery } from '@daqiq/core';

export interface FeatureFlagQuery extends ApiQuery {
  readonly search?: string;
  readonly category?: string;
  readonly enabled?: boolean;
}
