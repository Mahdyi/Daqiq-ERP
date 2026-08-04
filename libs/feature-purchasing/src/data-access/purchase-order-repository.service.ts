import { HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiError, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type { PurchaseOrderLineRowDto } from '../dto/purchase-order-line-row.dto';
import type { PurchaseOrderRowDto } from '../dto/purchase-order-row.dto';
import {
  mapPurchaseOrderLineRow,
  mapPurchaseOrderRow
} from '../mappers/purchase-order.mapper';
import type { PurchaseOrderLine } from '../models/purchase-order-line.model';
import type { PurchaseOrderQuery } from '../models/purchase-order-query.model';
import type { PurchaseOrder } from '../models/purchase-order.model';
import { parsePostgrestContentRange } from './postgrest-content-range.util';
import {
  buildPurchaseOrderIdParams,
  buildPurchaseOrderLineParams,
  buildPurchaseOrderListRequest
} from './postgrest-purchase-order-query.util';

@Injectable()
export class PurchaseOrderRepository {
  private readonly api = inject(ApiClient);

  list(query?: PurchaseOrderQuery): Observable<ApiPage<PurchaseOrder>> {
    const request = buildPurchaseOrderListRequest(query);

    return this.api
      .getResponse<readonly PurchaseOrderRowDto[]>('purchase_order_view', {
        params: request.params,
        headers: {
          Prefer: 'count=exact',
          'Range-Unit': 'items',
          Range: request.range
        },
        responseShape: 'raw'
      })
      .pipe(
        map((response) => {
          const contentRange = parsePostgrestContentRange(response.headers.get('Content-Range'));

          return {
            items: (response.body ?? []).map(mapPurchaseOrderRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages: Math.ceil(contentRange.total / request.pageSize)
          };
        })
      );
  }

  getById(id: string): Observable<PurchaseOrder> {
    return this.api
      .getResponse<readonly PurchaseOrderRowDto[]>('purchase_order_view', {
        params: buildPurchaseOrderIdParams(id),
        headers: {
          Range: '0-0',
          'Range-Unit': 'items'
        },
        responseShape: 'raw'
      })
      .pipe(map((response) => this.readSingleOrder(response, id)));
  }

  listLines(purchaseOrderId: string): Observable<readonly PurchaseOrderLine[]> {
    return this.api
      .get<readonly PurchaseOrderLineRowDto[]>('purchase_order_line_view', {
        params: buildPurchaseOrderLineParams(purchaseOrderId),
        responseShape: 'raw'
      })
      .pipe(map((rows) => rows.map(mapPurchaseOrderLineRow)));
  }

  private readSingleOrder(
    response: HttpResponse<readonly PurchaseOrderRowDto[]>,
    id: string
  ): PurchaseOrder {
    const rows = response.body ?? [];

    if (rows.length === 0) {
      throw new ApiError({
        status: 404,
        code: 'NOT_FOUND',
        message: 'سفارش خرید موردنظر یافت نشد.',
        details: id,
        fieldErrors: []
      });
    }

    if (rows.length !== 1) {
      throw new ApiError({
        status: 0,
        code: 'UNKNOWN',
        message: 'پاسخ دریافت‌شده از سرور معتبر نیست.',
        fieldErrors: []
      });
    }

    return mapPurchaseOrderRow(rows[0]);
  }
}
