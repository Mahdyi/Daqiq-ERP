import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiError, ApiPage } from '@daqiq/core';
import { CrudResource } from '@daqiq/shared';
import { Observable, map } from 'rxjs';

import type { CreateProductPostgrestRequest } from '../dto/create-product-postgrest-request.dto';
import type { ProductPostgrestRow } from '../dto/product-postgrest-row.dto';
import type { UpdateProductPostgrestRequest } from '../dto/update-product-postgrest-request.dto';
import { mapProductPostgrestRow } from '../mappers/product.mapper';
import type { Product } from '../models/product.model';
import type { ProductQuery } from '../models/product-query.model';
import {
  PRODUCT_SELECT_COLUMNS,
  buildPostgrestProductIdParams,
  buildPostgrestProductListRequest
} from './postgrest-product-query.util';
import { parsePostgrestContentRange } from './postgrest-content-range.util';

@Injectable()
export class ProductRepository
  implements
    CrudResource<
      Product,
      string,
      CreateProductPostgrestRequest,
      UpdateProductPostgrestRequest,
      ProductQuery
    >
{
  private readonly api = inject(ApiClient);

  list(query?: ProductQuery): Observable<ApiPage<Product>> {
    const request = buildPostgrestProductListRequest(query);

    return this.api
      .getResponse<readonly ProductPostgrestRow[]>('products', {
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
            items: (response.body ?? []).map(mapProductPostgrestRow),
            page: request.page,
            pageSize: request.pageSize,
            totalItems: contentRange.total,
            totalPages: Math.ceil(contentRange.total / request.pageSize)
          };
        })
      );
  }

  getById(id: string): Observable<Product> {
    return this.api
      .getResponse<readonly ProductPostgrestRow[]>('products', {
        params: buildPostgrestProductIdParams(id),
        headers: {
          Range: '0-0',
          'Range-Unit': 'items'
        },
        responseShape: 'raw'
      })
      .pipe(map((response) => this.readSingleProduct(response, id)));
  }

  create(request: CreateProductPostgrestRequest): Observable<Product> {
    return this.api
      .postResponse<CreateProductPostgrestRequest, readonly ProductPostgrestRow[]>(
        'products',
        request,
        {
          params: {
            select: PRODUCT_SELECT_COLUMNS
          },
          headers: this.returnRepresentationHeaders(),
          responseShape: 'raw'
        }
      )
      .pipe(map((response) => this.readSingleProduct(response)));
  }

  update(id: string, request: UpdateProductPostgrestRequest): Observable<Product> {
    return this.api
      .patchResponse<UpdateProductPostgrestRequest, readonly ProductPostgrestRow[]>(
        'products',
        request,
        {
          params: buildPostgrestProductIdParams(id),
          headers: this.returnRepresentationHeaders(),
          responseShape: 'raw'
        }
      )
      .pipe(map((response) => this.readSingleProduct(response, id)));
  }

  delete(id: string): Observable<void> {
    return this.api
      .deleteResponse<readonly ProductPostgrestRow[]>('products', {
        params: buildPostgrestProductIdParams(id),
        headers: this.returnRepresentationHeaders(),
        responseShape: 'raw'
      })
      .pipe(
        map((response) => {
          this.readSingleProduct(response, id);
          return undefined;
        })
      );
  }

  private returnRepresentationHeaders(): HttpHeaders {
    return new HttpHeaders({
      Prefer: 'return=representation'
    });
  }

  private readSingleProduct(
    response: HttpResponse<readonly ProductPostgrestRow[]>,
    id?: string
  ): Product {
    const rows = response.body ?? [];

    if (rows.length === 0) {
      throw new ApiError({
        status: 404,
        code: 'NOT_FOUND',
        message: 'کالای موردنظر یافت نشد.',
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

    return mapProductPostgrestRow(rows[0]);
  }
}
