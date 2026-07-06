import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiError, ApiPage } from '@daqiq/core';
import { CrudResource } from '@daqiq/shared';
import { Observable, map } from 'rxjs';

import { CreateCustomerPostgrestRequest } from '../dto/create-customer-postgrest-request.dto';
import { CustomerPostgrestRow } from '../dto/customer-postgrest-row.dto';
import { UpdateCustomerPostgrestRequest } from '../dto/update-customer-postgrest-request.dto';
import { mapCustomerPostgrestRow } from '../mappers/customer.mapper';
import { Customer } from '../models/customer.model';
import { CustomerQuery } from '../models/customer-query.model';
import {
  buildPostgrestCustomerListRequest,
  buildPostgrestIdParams,
  CUSTOMER_SELECT_COLUMNS
} from './postgrest-customer-query.util';
import { parsePostgrestContentRange } from './postgrest-content-range.util';

@Injectable()
export class CustomerRepository
  implements
    CrudResource<
      Customer,
      string,
      CreateCustomerPostgrestRequest,
      UpdateCustomerPostgrestRequest,
      CustomerQuery
    >
{
  private readonly api = inject(ApiClient);

  list(query?: CustomerQuery): Observable<ApiPage<Customer>> {
    const request = buildPostgrestCustomerListRequest(query);

    return this.api
      .getResponse<readonly CustomerPostgrestRow[]>('customers', {
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
          const totalPages = Math.ceil(contentRange.total / request.pageSize);

          return {
            items: (response.body ?? []).map(mapCustomerPostgrestRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages
          };
        })
      );
  }

  getById(id: string): Observable<Customer> {
    return this.api
      .getResponse<readonly CustomerPostgrestRow[]>('customers', {
        params: buildPostgrestIdParams(id),
        headers: {
          Range: '0-0',
          'Range-Unit': 'items'
        },
        responseShape: 'raw'
      })
      .pipe(map((response) => this.readSingleCustomer(response, id)));
  }

  create(request: CreateCustomerPostgrestRequest): Observable<Customer> {
    return this.api
      .postResponse<CreateCustomerPostgrestRequest, readonly CustomerPostgrestRow[]>(
        'customers',
        request,
        {
          params: {
            select: CUSTOMER_SELECT_COLUMNS
          },
          headers: this.returnRepresentationHeaders(),
          responseShape: 'raw'
        }
      )
      .pipe(map((response) => this.readSingleCustomer(response)));
  }

  update(
    id: string,
    request: UpdateCustomerPostgrestRequest
  ): Observable<Customer> {
    return this.api
      .patchResponse<UpdateCustomerPostgrestRequest, readonly CustomerPostgrestRow[]>(
        'customers',
        request,
        {
          params: buildPostgrestIdParams(id),
          headers: this.returnRepresentationHeaders(),
          responseShape: 'raw'
        }
      )
      .pipe(map((response) => this.readSingleCustomer(response, id)));
  }

  delete(id: string): Observable<void> {
    return this.api
      .deleteResponse<readonly CustomerPostgrestRow[]>('customers', {
        params: buildPostgrestIdParams(id),
        headers: this.returnRepresentationHeaders(),
        responseShape: 'raw'
      })
      .pipe(
        map((response) => {
          this.readSingleCustomer(response, id);
          return undefined;
        })
      );
  }

  private returnRepresentationHeaders(): HttpHeaders {
    return new HttpHeaders({
      Prefer: 'return=representation'
    });
  }

  private readSingleCustomer(
    response: HttpResponse<readonly CustomerPostgrestRow[]>,
    id?: string
  ): Customer {
    const rows = response.body ?? [];

    if (rows.length === 0) {
      throw this.notFoundError(id);
    }

    if (rows.length !== 1) {
      throw new ApiError({
        status: 0,
        code: 'UNKNOWN',
        message: 'پاسخ دریافتی از سرور معتبر نیست.',
        fieldErrors: []
      });
    }

    return mapCustomerPostgrestRow(rows[0]);
  }

  private notFoundError(id?: string): ApiError {
    return new ApiError({
      status: 404,
      code: 'NOT_FOUND',
      message: 'مشتری موردنظر یافت نشد.',
      details: id,
      fieldErrors: []
    });
  }
}
