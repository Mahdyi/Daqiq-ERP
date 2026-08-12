import type { ApiQuery } from '@daqiq/core';

export interface ReportQuery extends ApiQuery {
  readonly search?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly statusCode?: string;
  readonly warehouseId?: string;
  readonly productId?: string;
  readonly accountId?: string;
}
