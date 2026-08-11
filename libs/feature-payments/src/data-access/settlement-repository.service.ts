import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type {
  SalesInvoiceSettlementRowDto,
  SupplierInvoiceSettlementRowDto
} from '../dto/settlement-row.dto';
import {
  mapSalesInvoiceSettlementRow,
  mapSupplierInvoiceSettlementRow
} from '../mappers/payment.mapper';
import type { SettlementQuery } from '../models/payment-query.model';
import type {
  SalesInvoiceSettlement,
  SupplierInvoiceSettlement
} from '../models/settlement.model';
import { parsePostgrestContentRange } from './postgrest-content-range.util';
import {
  buildSalesSettlementListRequest,
  buildSupplierSettlementListRequest
} from './postgrest-payments-query.util';

@Injectable()
export class SettlementRepository {
  private readonly api = inject(ApiClient);

  listSales(query?: SettlementQuery): Observable<ApiPage<SalesInvoiceSettlement>> {
    const request = buildSalesSettlementListRequest(query);

    return this.api
      .getResponse<readonly SalesInvoiceSettlementRowDto[]>('sales_invoice_settlement_view', {
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
            items: (response.body ?? []).map(mapSalesInvoiceSettlementRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages: Math.ceil(contentRange.total / request.pageSize)
          };
        })
      );
  }

  listSuppliers(query?: SettlementQuery): Observable<ApiPage<SupplierInvoiceSettlement>> {
    const request = buildSupplierSettlementListRequest(query);

    return this.api
      .getResponse<readonly SupplierInvoiceSettlementRowDto[]>('supplier_invoice_settlement_view', {
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
            items: (response.body ?? []).map(mapSupplierInvoiceSettlementRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages: Math.ceil(contentRange.total / request.pageSize)
          };
        })
      );
  }
}
