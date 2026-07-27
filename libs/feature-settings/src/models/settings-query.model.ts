import type { ApiQuery } from '@daqiq/core';

export interface SettingsQuery extends ApiQuery {
  readonly search?: string;
  readonly category?: string;
  readonly active?: boolean;
}
