import type { ApiQuery } from '@daqiq/core';

import type { GoodsReceipt } from './goods-receipt.model';

export interface GoodsReceiptQuery extends ApiQuery {
  readonly search?: string;
  readonly purchaseOrderId?: string;
  readonly supplierId?: string;
  readonly warehouseId?: string;
  readonly statusCode?: string;
  readonly sortField?: keyof GoodsReceipt;
  readonly sortDirection?: 'asc' | 'desc';
}
