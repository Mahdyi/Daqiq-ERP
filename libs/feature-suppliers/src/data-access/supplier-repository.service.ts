import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiError, ApiPage } from '@daqiq/core';
import { CrudResource } from '@daqiq/shared';
import { Observable, map } from 'rxjs';

import type { CreateSupplierPostgrestRequest } from '../dto/create-supplier-postgrest-request.dto';
import type { SupplierPostgrestRow } from '../dto/supplier-postgrest-row.dto';
import type { UpdateSupplierPostgrestRequest } from '../dto/update-supplier-postgrest-request.dto';
import { mapSupplierPostgrestRow } from '../mappers/supplier.mapper';
import type { SupplierQuery } from '../models/supplier-query.model';
import type { Supplier } from '../models/supplier.model';
import {
  SUPPLIER_SELECT_COLUMNS,
  buildPostgrestSupplierIdParams,
  buildPostgrestSupplierListRequest
} from './postgrest-supplier-query.util';
import { parsePostgrestContentRange } from './postgrest-content-range.util';

@Injectable()
export class SupplierRepository
  implements
    CrudResource<
      Supplier,
      string,
      CreateSupplierPostgrestRequest,
      UpdateSupplierPostgrestRequest,
      SupplierQuery
    >
{
  private readonly api = inject(ApiClient);

  list(query?: SupplierQuery): Observable<ApiPage<Supplier>> {
    const request = buildPostgrestSupplierListRequest(query);

    return this.api
      .getResponse<readonly SupplierPostgrestRow[]>('suppliers', {
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
            items: (response.body ?? []).map(mapSupplierPostgrestRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages: Math.ceil(contentRange.total / request.pageSize)
          };
        })
      );
  }

  getById(id: string): Observable<Supplier> {
    return this.api
      .getResponse<readonly SupplierPostgrestRow[]>('suppliers', {
        params: buildPostgrestSupplierIdParams(id),
        headers: {
          Range: '0-0',
          'Range-Unit': 'items'
        },
        responseShape: 'raw'
      })
      .pipe(map((response) => this.readSingleSupplier(response, id)));
  }

  create(request: CreateSupplierPostgrestRequest): Observable<Supplier> {
    return this.api
      .postResponse<CreateSupplierPostgrestRequest, readonly SupplierPostgrestRow[]>(
        'suppliers',
        request,
        {
          params: {
            select: SUPPLIER_SELECT_COLUMNS
          },
          headers: this.returnRepresentationHeaders(),
          responseShape: 'raw'
        }
      )
      .pipe(map((response) => this.readSingleSupplier(response)));
  }

  update(id: string, request: UpdateSupplierPostgrestRequest): Observable<Supplier> {
    return this.api
      .patchResponse<UpdateSupplierPostgrestRequest, readonly SupplierPostgrestRow[]>(
        'suppliers',
        request,
        {
          params: buildPostgrestSupplierIdParams(id),
          headers: this.returnRepresentationHeaders(),
          responseShape: 'raw'
        }
      )
      .pipe(map((response) => this.readSingleSupplier(response, id)));
  }

  delete(id: string): Observable<void> {
    return this.api
      .deleteResponse<readonly SupplierPostgrestRow[]>('suppliers', {
        params: buildPostgrestSupplierIdParams(id),
        headers: this.returnRepresentationHeaders(),
        responseShape: 'raw'
      })
      .pipe(
        map((response) => {
          this.readSingleSupplier(response, id);
          return undefined;
        })
      );
  }

  private returnRepresentationHeaders(): HttpHeaders {
    return new HttpHeaders({
      Prefer: 'return=representation'
    });
  }

  private readSingleSupplier(
    response: HttpResponse<readonly SupplierPostgrestRow[]>,
    id?: string
  ): Supplier {
    const rows = response.body ?? [];

    if (rows.length === 0) {
      throw new ApiError({
        status: 404,
        code: 'NOT_FOUND',
        message: 'تأمین‌کننده موردنظر یافت نشد.',
        details: id,
        fieldErrors: []
      });
    }

    if (rows.length !== 1) {
      throw new ApiError({
        status: 0,
        code: 'UNKNOWN',
        message: 'پاسخ دریافتی از سرور معتبر نیست.',
        fieldErrors: []
      });
    }

    return mapSupplierPostgrestRow(rows[0]);
  }
}
