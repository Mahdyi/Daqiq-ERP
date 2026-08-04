import { HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiError, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type { GoodsReceiptLineRowDto } from '../dto/goods-receipt-line-row.dto';
import type { GoodsReceiptRowDto } from '../dto/goods-receipt-row.dto';
import type { PurchaseOrderLineReceivingProgressRowDto } from '../dto/purchase-order-receiving-progress-row.dto';
import {
  mapGoodsReceiptLineRow,
  mapGoodsReceiptRow,
  mapPurchaseOrderLineReceivingProgressRow
} from '../mappers/goods-receipt.mapper';
import type { GoodsReceiptLine } from '../models/goods-receipt-line.model';
import type { GoodsReceiptQuery } from '../models/goods-receipt-query.model';
import type { GoodsReceipt } from '../models/goods-receipt.model';
import type { PurchaseOrderLineReceivingProgress } from '../models/purchase-order-receiving-progress.model';
import {
  buildGoodsReceiptIdParams,
  buildGoodsReceiptLineParams,
  buildGoodsReceiptListRequest,
  buildPurchaseOrderReceivingProgressParams
} from './postgrest-goods-receipt-query.util';
import { parsePostgrestContentRange } from './postgrest-content-range.util';

@Injectable()
export class GoodsReceiptRepository {
  private readonly api = inject(ApiClient);

  list(query?: GoodsReceiptQuery): Observable<ApiPage<GoodsReceipt>> {
    const request = buildGoodsReceiptListRequest(query);

    return this.api
      .getResponse<readonly GoodsReceiptRowDto[]>('goods_receipt_view', {
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
            items: (response.body ?? []).map(mapGoodsReceiptRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages: Math.ceil(contentRange.total / request.pageSize)
          };
        })
      );
  }

  getById(id: string): Observable<GoodsReceipt> {
    return this.api
      .getResponse<readonly GoodsReceiptRowDto[]>('goods_receipt_view', {
        params: buildGoodsReceiptIdParams(id),
        headers: {
          Range: '0-0',
          'Range-Unit': 'items'
        },
        responseShape: 'raw'
      })
      .pipe(map((response) => this.readSingleReceipt(response, id)));
  }

  listLines(goodsReceiptId: string): Observable<readonly GoodsReceiptLine[]> {
    return this.api
      .get<readonly GoodsReceiptLineRowDto[]>('goods_receipt_line_view', {
        params: buildGoodsReceiptLineParams(goodsReceiptId),
        responseShape: 'raw'
      })
      .pipe(map((rows) => rows.map(mapGoodsReceiptLineRow)));
  }

  listPurchaseOrderReceivingProgress(
    purchaseOrderId: string
  ): Observable<readonly PurchaseOrderLineReceivingProgress[]> {
    return this.api
      .get<readonly PurchaseOrderLineReceivingProgressRowDto[]>(
        'purchase_order_line_receiving_view',
        {
          params: buildPurchaseOrderReceivingProgressParams(purchaseOrderId),
          responseShape: 'raw'
        }
      )
      .pipe(map((rows) => rows.map(mapPurchaseOrderLineReceivingProgressRow)));
  }

  private readSingleReceipt(
    response: HttpResponse<readonly GoodsReceiptRowDto[]>,
    id: string
  ): GoodsReceipt {
    const rows = response.body ?? [];

    if (rows.length === 0) {
      throw new ApiError({
        status: 404,
        code: 'NOT_FOUND',
        message: 'رسید خرید موردنظر یافت نشد.',
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

    return mapGoodsReceiptRow(rows[0]);
  }
}
