import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiError, ApiPage } from '@daqiq/core';
import { CrudResource } from '@daqiq/shared';
import { Observable, map } from 'rxjs';
import type { CreateWarehousePostgrestRequest } from '../dto/create-warehouse-postgrest-request.dto';
import type { UpdateWarehousePostgrestRequest } from '../dto/update-warehouse-postgrest-request.dto';
import type { WarehousePostgrestRow } from '../dto/warehouse-postgrest-row.dto';
import { mapWarehousePostgrestRow } from '../mappers/warehouse.mapper';
import type { WarehouseQuery } from '../models/warehouse-query.model';
import type { Warehouse } from '../models/warehouse.model';
import { parsePostgrestContentRange } from './postgrest-content-range.util';
import { WAREHOUSE_SELECT_COLUMNS, buildPostgrestWarehouseIdParams, buildPostgrestWarehouseListRequest } from './postgrest-warehouse-query.util';

@Injectable()
export class WarehouseRepository implements CrudResource<Warehouse, string, CreateWarehousePostgrestRequest, UpdateWarehousePostgrestRequest, WarehouseQuery> {
  private readonly api = inject(ApiClient);

  list(query?: WarehouseQuery): Observable<ApiPage<Warehouse>> {
    const request = buildPostgrestWarehouseListRequest(query);
    return this.api.getResponse<readonly WarehousePostgrestRow[]>('warehouses', {
      params: request.params,
      headers: { Prefer: 'count=exact', 'Range-Unit': 'items', Range: request.range },
      responseShape: 'raw'
    }).pipe(map((response) => {
      const contentRange = parsePostgrestContentRange(response.headers.get('Content-Range'));
      return {
        items: (response.body ?? []).map(mapWarehousePostgrestRow),
        page: request.page,
        pageSize: request.pageSize,
        totalItems: contentRange.total,
        totalPages: Math.ceil(contentRange.total / request.pageSize)
      };
    }));
  }

  getById(id: string): Observable<Warehouse> {
    return this.api.getResponse<readonly WarehousePostgrestRow[]>('warehouses', {
      params: buildPostgrestWarehouseIdParams(id),
      headers: { Range: '0-0', 'Range-Unit': 'items' },
      responseShape: 'raw'
    }).pipe(map((response) => this.readSingle(response, id)));
  }

  create(request: CreateWarehousePostgrestRequest): Observable<Warehouse> {
    return this.api.postResponse<CreateWarehousePostgrestRequest, readonly WarehousePostgrestRow[]>('warehouses', request, {
      params: { select: WAREHOUSE_SELECT_COLUMNS },
      headers: this.returnRepresentationHeaders(),
      responseShape: 'raw'
    }).pipe(map((response) => this.readSingle(response)));
  }

  update(id: string, request: UpdateWarehousePostgrestRequest): Observable<Warehouse> {
    return this.api.patchResponse<UpdateWarehousePostgrestRequest, readonly WarehousePostgrestRow[]>('warehouses', request, {
      params: buildPostgrestWarehouseIdParams(id),
      headers: this.returnRepresentationHeaders(),
      responseShape: 'raw'
    }).pipe(map((response) => this.readSingle(response, id)));
  }

  delete(id: string): Observable<void> {
    return this.api.deleteResponse<readonly WarehousePostgrestRow[]>('warehouses', {
      params: buildPostgrestWarehouseIdParams(id),
      headers: this.returnRepresentationHeaders(),
      responseShape: 'raw'
    }).pipe(map((response) => {
      this.readSingle(response, id);
      return undefined;
    }));
  }

  private returnRepresentationHeaders(): HttpHeaders {
    return new HttpHeaders({ Prefer: 'return=representation' });
  }

  private readSingle(response: HttpResponse<readonly WarehousePostgrestRow[]>, id?: string): Warehouse {
    const rows = response.body ?? [];
    if (rows.length === 0) {
      throw new ApiError({ status: 404, code: 'NOT_FOUND', message: 'انبار موردنظر یافت نشد.', details: id, fieldErrors: [] });
    }
    if (rows.length !== 1) {
      throw new ApiError({ status: 0, code: 'UNKNOWN', message: 'پاسخ دریافتی از سرور معتبر نیست.', fieldErrors: [] });
    }
    return mapWarehousePostgrestRow(rows[0]);
  }
}
