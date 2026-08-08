import type { ApiQuery } from '@daqiq/core';

import type { SupplierInvoiceStatus } from './supplier-invoice-status.model';
import type { SupplierInvoice } from './supplier-invoice.model';

export interface SupplierInvoiceQuery extends ApiQuery {
  readonly search?: string;
  readonly supplierId?: string;
  readonly purchaseOrderId?: string;
  readonly goodsReceiptId?: string;
  readonly statusCode?: SupplierInvoiceStatus;
  readonly invoiceDateFrom?: string;
  readonly invoiceDateTo?: string;
  readonly sortField?: keyof SupplierInvoice;
  readonly sortDirection?: 'asc' | 'desc';
}
