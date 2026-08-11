import type { ApiQuery } from '@daqiq/core';

export type PaymentSortDirection = 'asc' | 'desc';

export interface PaymentListQuery extends ApiQuery {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly sortField?: string;
  readonly sortDirection?: PaymentSortDirection;
}

export interface SettlementQuery extends PaymentListQuery {
  readonly settlementStatus?: 'unpaid' | 'partially_paid' | 'paid';
}
