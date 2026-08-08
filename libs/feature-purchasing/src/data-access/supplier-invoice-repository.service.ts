import { HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiError, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type { GoodsReceiptLineSupplierInvoicingProgressRowDto } from '../dto/goods-receipt-line-supplier-invoicing-progress-row.dto';
import type { SupplierInvoiceLineRowDto } from '../dto/supplier-invoice-line-row.dto';
import type { SupplierInvoiceRowDto } from '../dto/supplier-invoice-row.dto';
import {
  mapGoodsReceiptLineSupplierInvoicingProgressRow,
  mapSupplierInvoiceLineRow,
  mapSupplierInvoiceRow
} from '../mappers/supplier-invoice.mapper';
import type { GoodsReceiptLineSupplierInvoicingProgress } from '../models/goods-receipt-line-supplier-invoicing-progress.model';
import type { SupplierInvoiceLine } from '../models/supplier-invoice-line.model';
import type { SupplierInvoiceQuery } from '../models/supplier-invoice-query.model';
import type { SupplierInvoice } from '../models/supplier-invoice.model';
import { parsePostgrestContentRange } from './postgrest-content-range.util';
import {
  buildGoodsReceiptSupplierInvoicingProgressParams,
  buildSupplierInvoiceIdParams,
  buildSupplierInvoiceLineParams,
  buildSupplierInvoiceListRequest
} from './postgrest-supplier-invoice-query.util';

@Injectable()
export class SupplierInvoiceRepository {
  private readonly api = inject(ApiClient);

  list(query?: SupplierInvoiceQuery): Observable<ApiPage<SupplierInvoice>> {
    const request = buildSupplierInvoiceListRequest(query);

    return this.api
      .getResponse<readonly SupplierInvoiceRowDto[]>('supplier_invoice_view', {
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
            items: (response.body ?? []).map(mapSupplierInvoiceRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages: Math.ceil(contentRange.total / request.pageSize)
          };
        })
      );
  }

  getById(id: string): Observable<SupplierInvoice> {
    return this.api
      .getResponse<readonly SupplierInvoiceRowDto[]>('supplier_invoice_view', {
        params: buildSupplierInvoiceIdParams(id),
        headers: {
          Range: '0-0',
          'Range-Unit': 'items'
        },
        responseShape: 'raw'
      })
      .pipe(map((response) => this.readSingleInvoice(response, id)));
  }

  listLines(supplierInvoiceId: string): Observable<readonly SupplierInvoiceLine[]> {
    return this.api
      .get<readonly SupplierInvoiceLineRowDto[]>('supplier_invoice_line_view', {
        params: buildSupplierInvoiceLineParams(supplierInvoiceId),
        responseShape: 'raw'
      })
      .pipe(map((rows) => rows.map(mapSupplierInvoiceLineRow)));
  }

  listGoodsReceiptProgress(
    goodsReceiptId: string
  ): Observable<readonly GoodsReceiptLineSupplierInvoicingProgress[]> {
    return this.api
      .get<readonly GoodsReceiptLineSupplierInvoicingProgressRowDto[]>(
        'goods_receipt_line_supplier_invoicing_view',
        {
          params: buildGoodsReceiptSupplierInvoicingProgressParams(goodsReceiptId),
          responseShape: 'raw'
        }
      )
      .pipe(map((rows) => rows.map(mapGoodsReceiptLineSupplierInvoicingProgressRow)));
  }

  private readSingleInvoice(
    response: HttpResponse<readonly SupplierInvoiceRowDto[]>,
    id: string
  ): SupplierInvoice {
    const rows = response.body ?? [];

    if (rows.length === 0) {
      throw new ApiError({
        status: 404,
        code: 'NOT_FOUND',
        message: 'فاکتور تأمین‌کننده موردنظر یافت نشد.',
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

    return mapSupplierInvoiceRow(rows[0]);
  }
}
