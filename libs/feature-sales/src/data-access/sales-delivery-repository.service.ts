import { HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiError, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type { SalesDeliveryLineRowDto } from '../dto/sales-delivery-line-row.dto';
import type { SalesDeliveryRowDto } from '../dto/sales-delivery-row.dto';
import type { SalesOrderLineDeliveryProgressRowDto } from '../dto/sales-order-line-delivery-progress-row.dto';
import {
  mapSalesDeliveryLineRow,
  mapSalesDeliveryRow,
  mapSalesOrderLineDeliveryProgressRow
} from '../mappers/sales-delivery.mapper';
import type { SalesDeliveryLine } from '../models/sales-delivery-line.model';
import type { SalesDeliveryQuery } from '../models/sales-delivery-query.model';
import type { SalesDelivery } from '../models/sales-delivery.model';
import type { SalesOrderLineDeliveryProgress } from '../models/sales-order-line-delivery-progress.model';
import { parsePostgrestContentRange } from './postgrest-content-range.util';
import {
  buildSalesDeliveryIdParams,
  buildSalesDeliveryLineParams,
  buildSalesDeliveryListRequest,
  buildSalesOrderDeliveryProgressParams
} from './postgrest-sales-delivery-query.util';

@Injectable()
export class SalesDeliveryRepository {
  private readonly api = inject(ApiClient);

  list(query?: SalesDeliveryQuery): Observable<ApiPage<SalesDelivery>> {
    const request = buildSalesDeliveryListRequest(query);

    return this.api
      .getResponse<readonly SalesDeliveryRowDto[]>('sales_delivery_view', {
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
            items: (response.body ?? []).map(mapSalesDeliveryRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages: Math.ceil(contentRange.total / request.pageSize)
          };
        })
      );
  }

  getById(id: string): Observable<SalesDelivery> {
    return this.api
      .getResponse<readonly SalesDeliveryRowDto[]>('sales_delivery_view', {
        params: buildSalesDeliveryIdParams(id),
        headers: {
          Range: '0-0',
          'Range-Unit': 'items'
        },
        responseShape: 'raw'
      })
      .pipe(map((response) => this.readSingleDelivery(response, id)));
  }

  listLines(salesDeliveryId: string): Observable<readonly SalesDeliveryLine[]> {
    return this.api
      .get<readonly SalesDeliveryLineRowDto[]>('sales_delivery_line_view', {
        params: buildSalesDeliveryLineParams(salesDeliveryId),
        responseShape: 'raw'
      })
      .pipe(map((rows) => rows.map(mapSalesDeliveryLineRow)));
  }

  listSalesOrderProgress(
    salesOrderId: string
  ): Observable<readonly SalesOrderLineDeliveryProgress[]> {
    return this.api
      .get<readonly SalesOrderLineDeliveryProgressRowDto[]>('sales_order_line_delivery_view', {
        params: buildSalesOrderDeliveryProgressParams(salesOrderId),
        responseShape: 'raw'
      })
      .pipe(map((rows) => rows.map(mapSalesOrderLineDeliveryProgressRow)));
  }

  private readSingleDelivery(
    response: HttpResponse<readonly SalesDeliveryRowDto[]>,
    id: string
  ): SalesDelivery {
    const rows = response.body ?? [];

    if (rows.length === 0) {
      throw new ApiError({
        status: 404,
        code: 'NOT_FOUND',
        message: 'حواله فروش موردنظر یافت نشد.',
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

    return mapSalesDeliveryRow(rows[0]);
  }
}
