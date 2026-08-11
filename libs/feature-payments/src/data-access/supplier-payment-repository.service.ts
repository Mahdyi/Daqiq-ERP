import { HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiError, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type {
  SupplierPaymentAllocationRowDto,
  SupplierPaymentRowDto
} from '../dto/payment-row.dto';
import {
  mapSupplierPaymentAllocationRow,
  mapSupplierPaymentRow
} from '../mappers/payment.mapper';
import type { PaymentListQuery } from '../models/payment-query.model';
import type { SupplierPayment, SupplierPaymentAllocation } from '../models/supplier-payment.model';
import { parsePostgrestContentRange } from './postgrest-content-range.util';
import {
  SUPPLIER_PAYMENT_ALLOCATION_SELECT,
  SUPPLIER_PAYMENT_SELECT,
  buildIdParams,
  buildSupplierPaymentListRequest
} from './postgrest-payments-query.util';

@Injectable()
export class SupplierPaymentRepository {
  private readonly api = inject(ApiClient);

  list(query?: PaymentListQuery): Observable<ApiPage<SupplierPayment>> {
    const request = buildSupplierPaymentListRequest(query);

    return this.api
      .getResponse<readonly SupplierPaymentRowDto[]>('supplier_payment_view', {
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
            items: (response.body ?? []).map(mapSupplierPaymentRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages: Math.ceil(contentRange.total / request.pageSize)
          };
        })
      );
  }

  getById(id: string): Observable<SupplierPayment> {
    return this.api
      .getResponse<readonly SupplierPaymentRowDto[]>('supplier_payment_view', {
        params: buildIdParams(SUPPLIER_PAYMENT_SELECT, 'id', id),
        headers: { Range: '0-0', 'Range-Unit': 'items' },
        responseShape: 'raw'
      })
      .pipe(map((response) => this.readSingle(response, id)));
  }

  listAllocations(paymentId: string): Observable<readonly SupplierPaymentAllocation[]> {
    return this.api
      .get<readonly SupplierPaymentAllocationRowDto[]>('supplier_payment_allocation_view', {
        params: buildIdParams(SUPPLIER_PAYMENT_ALLOCATION_SELECT, 'supplier_payment_id', paymentId),
        responseShape: 'raw'
      })
      .pipe(map((rows) => rows.map(mapSupplierPaymentAllocationRow)));
  }

  private readSingle(response: HttpResponse<readonly SupplierPaymentRowDto[]>, id: string): SupplierPayment {
    const rows = response.body ?? [];

    if (rows.length !== 1) {
      throw new ApiError({
        status: 404,
        code: 'NOT_FOUND',
        message: 'پرداخت تأمین‌کننده موردنظر یافت نشد.',
        details: id,
        fieldErrors: []
      });
    }

    return mapSupplierPaymentRow(rows[0]);
  }
}
