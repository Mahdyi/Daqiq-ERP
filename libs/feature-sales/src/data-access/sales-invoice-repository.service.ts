import { HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiError, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type { SalesDeliveryLineInvoicingProgressRowDto } from '../dto/sales-delivery-line-invoicing-progress-row.dto';
import type { SalesInvoiceLineRowDto } from '../dto/sales-invoice-line-row.dto';
import type { SalesInvoiceRowDto } from '../dto/sales-invoice-row.dto';
import {
  mapSalesDeliveryLineInvoicingProgressRow,
  mapSalesInvoiceLineRow,
  mapSalesInvoiceRow
} from '../mappers/sales-invoice.mapper';
import type { SalesDeliveryLineInvoicingProgress } from '../models/sales-delivery-line-invoicing-progress.model';
import type { SalesInvoiceLine } from '../models/sales-invoice-line.model';
import type { SalesInvoiceQuery } from '../models/sales-invoice-query.model';
import type { SalesInvoice } from '../models/sales-invoice.model';
import { parsePostgrestContentRange } from './postgrest-content-range.util';
import {
  buildSalesDeliveryInvoicingProgressParams,
  buildSalesInvoiceIdParams,
  buildSalesInvoiceLineParams,
  buildSalesInvoiceListRequest
} from './postgrest-sales-invoice-query.util';

@Injectable()
export class SalesInvoiceRepository {
  private readonly api = inject(ApiClient);

  list(query?: SalesInvoiceQuery): Observable<ApiPage<SalesInvoice>> {
    const request = buildSalesInvoiceListRequest(query);

    return this.api
      .getResponse<readonly SalesInvoiceRowDto[]>('sales_invoice_view', {
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
            items: (response.body ?? []).map(mapSalesInvoiceRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages: Math.ceil(contentRange.total / request.pageSize)
          };
        })
      );
  }

  getById(id: string): Observable<SalesInvoice> {
    return this.api
      .getResponse<readonly SalesInvoiceRowDto[]>('sales_invoice_view', {
        params: buildSalesInvoiceIdParams(id),
        headers: {
          Range: '0-0',
          'Range-Unit': 'items'
        },
        responseShape: 'raw'
      })
      .pipe(map((response) => this.readSingleInvoice(response, id)));
  }

  listLines(salesInvoiceId: string): Observable<readonly SalesInvoiceLine[]> {
    return this.api
      .get<readonly SalesInvoiceLineRowDto[]>('sales_invoice_line_view', {
        params: buildSalesInvoiceLineParams(salesInvoiceId),
        responseShape: 'raw'
      })
      .pipe(map((rows) => rows.map(mapSalesInvoiceLineRow)));
  }

  listSalesDeliveryProgress(
    salesDeliveryId: string
  ): Observable<readonly SalesDeliveryLineInvoicingProgress[]> {
    return this.api
      .get<readonly SalesDeliveryLineInvoicingProgressRowDto[]>('sales_delivery_line_invoicing_view', {
        params: buildSalesDeliveryInvoicingProgressParams(salesDeliveryId),
        responseShape: 'raw'
      })
      .pipe(map((rows) => rows.map(mapSalesDeliveryLineInvoicingProgressRow)));
  }

  private readSingleInvoice(
    response: HttpResponse<readonly SalesInvoiceRowDto[]>,
    id: string
  ): SalesInvoice {
    const rows = response.body ?? [];

    if (rows.length === 0) {
      throw new ApiError({
        status: 404,
        code: 'NOT_FOUND',
        message: 'فاکتور فروش موردنظر یافت نشد.',
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

    return mapSalesInvoiceRow(rows[0]);
  }
}
