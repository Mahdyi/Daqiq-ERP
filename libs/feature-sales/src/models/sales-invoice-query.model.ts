import type { ApiQuery } from '@daqiq/core';

import type { SalesInvoiceStatus } from './sales-invoice-status.model';
import type { SalesInvoice } from './sales-invoice.model';

export interface SalesInvoiceQuery extends ApiQuery {
  readonly search?: string;
  readonly customerId?: string;
  readonly salesOrderId?: string;
  readonly salesDeliveryId?: string;
  readonly statusCode?: SalesInvoiceStatus;
  readonly invoiceDateFrom?: string;
  readonly invoiceDateTo?: string;
  readonly sortField?: keyof SalesInvoice;
  readonly sortDirection?: 'asc' | 'desc';
}
