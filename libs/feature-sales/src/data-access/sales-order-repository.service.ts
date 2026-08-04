import { HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiError, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type { SalesOrderLineRowDto } from '../dto/sales-order-line-row.dto';
import type { SalesOrderRowDto } from '../dto/sales-order-row.dto';
import {
  mapSalesOrderLineRow,
  mapSalesOrderRow
} from '../mappers/sales-order.mapper';
import type { SalesOrderLine } from '../models/sales-order-line.model';
import type { SalesOrderQuery } from '../models/sales-order-query.model';
import type { SalesOrder } from '../models/sales-order.model';
import { parsePostgrestContentRange } from './postgrest-content-range.util';
import {
  buildSalesOrderIdParams,
  buildSalesOrderLineParams,
  buildSalesOrderListRequest
} from './postgrest-sales-order-query.util';

@Injectable()
export class SalesOrderRepository {
  private readonly api = inject(ApiClient);

  list(query?: SalesOrderQuery): Observable<ApiPage<SalesOrder>> {
    const request = buildSalesOrderListRequest(query);

    return this.api
      .getResponse<readonly SalesOrderRowDto[]>('sales_order_view', {
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
            items: (response.body ?? []).map(mapSalesOrderRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages: Math.ceil(contentRange.total / request.pageSize)
          };
        })
      );
  }

  getById(id: string): Observable<SalesOrder> {
    return this.api
      .getResponse<readonly SalesOrderRowDto[]>('sales_order_view', {
        params: buildSalesOrderIdParams(id),
        headers: {
          Range: '0-0',
          'Range-Unit': 'items'
        },
        responseShape: 'raw'
      })
      .pipe(map((response) => this.readSingleOrder(response, id)));
  }

  listLines(salesOrderId: string): Observable<readonly SalesOrderLine[]> {
    return this.api
      .get<readonly SalesOrderLineRowDto[]>('sales_order_line_view', {
        params: buildSalesOrderLineParams(salesOrderId),
        responseShape: 'raw'
      })
      .pipe(map((rows) => rows.map(mapSalesOrderLineRow)));
  }

  private readSingleOrder(
    response: HttpResponse<readonly SalesOrderRowDto[]>,
    id: string
  ): SalesOrder {
    const rows = response.body ?? [];

    if (rows.length === 0) {
      throw new ApiError({
        status: 404,
        code: 'NOT_FOUND',
        message: 'سفارش فروش موردنظر یافت نشد.',
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

    return mapSalesOrderRow(rows[0]);
  }
}

