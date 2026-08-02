import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiError, ApiPage } from '@daqiq/core';
import { CrudResource } from '@daqiq/shared';
import { Observable, map } from 'rxjs';
import type { CreateStorageLocationPostgrestRequest } from '../dto/create-storage-location-postgrest-request.dto';
import type { StorageLocationPostgrestRow } from '../dto/storage-location-postgrest-row.dto';
import type { UpdateStorageLocationPostgrestRequest } from '../dto/update-storage-location-postgrest-request.dto';
import { mapStorageLocationPostgrestRow } from '../mappers/storage-location.mapper';
import type { StorageLocationQuery } from '../models/storage-location-query.model';
import type { StorageLocation } from '../models/storage-location.model';
import { parsePostgrestContentRange } from './postgrest-content-range.util';
import { STORAGE_LOCATION_SELECT_COLUMNS, buildPostgrestStorageLocationIdParams, buildPostgrestStorageLocationListRequest } from './postgrest-storage-location-query.util';

@Injectable()
export class StorageLocationRepository implements CrudResource<StorageLocation, string, CreateStorageLocationPostgrestRequest, UpdateStorageLocationPostgrestRequest, StorageLocationQuery> {
  private readonly api = inject(ApiClient);

  list(query?: StorageLocationQuery): Observable<ApiPage<StorageLocation>> {
    const request = buildPostgrestStorageLocationListRequest(query);
    return this.api.getResponse<readonly StorageLocationPostgrestRow[]>('storage_locations', {
      params: request.params,
      headers: { Prefer: 'count=exact', 'Range-Unit': 'items', Range: request.range },
      responseShape: 'raw'
    }).pipe(map((response) => {
      const contentRange = parsePostgrestContentRange(response.headers.get('Content-Range'));
      return {
        items: (response.body ?? []).map(mapStorageLocationPostgrestRow),
        page: request.page,
        pageSize: request.pageSize,
        totalItems: contentRange.total,
        totalPages: Math.ceil(contentRange.total / request.pageSize)
      };
    }));
  }

  getById(id: string): Observable<StorageLocation> {
    return this.api.getResponse<readonly StorageLocationPostgrestRow[]>('storage_locations', {
      params: buildPostgrestStorageLocationIdParams(id),
      headers: { Range: '0-0', 'Range-Unit': 'items' },
      responseShape: 'raw'
    }).pipe(map((response) => this.readSingle(response, id)));
  }

  create(request: CreateStorageLocationPostgrestRequest): Observable<StorageLocation> {
    return this.api.postResponse<CreateStorageLocationPostgrestRequest, readonly StorageLocationPostgrestRow[]>('storage_locations', request, {
      params: { select: STORAGE_LOCATION_SELECT_COLUMNS },
      headers: this.returnRepresentationHeaders(),
      responseShape: 'raw'
    }).pipe(map((response) => this.readSingle(response)));
  }

  update(id: string, request: UpdateStorageLocationPostgrestRequest): Observable<StorageLocation> {
    return this.api.patchResponse<UpdateStorageLocationPostgrestRequest, readonly StorageLocationPostgrestRow[]>('storage_locations', request, {
      params: buildPostgrestStorageLocationIdParams(id),
      headers: this.returnRepresentationHeaders(),
      responseShape: 'raw'
    }).pipe(map((response) => this.readSingle(response, id)));
  }

  delete(id: string): Observable<void> {
    return this.api.deleteResponse<readonly StorageLocationPostgrestRow[]>('storage_locations', {
      params: buildPostgrestStorageLocationIdParams(id),
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

  private readSingle(response: HttpResponse<readonly StorageLocationPostgrestRow[]>, id?: string): StorageLocation {
    const rows = response.body ?? [];
    if (rows.length === 0) {
      throw new ApiError({ status: 404, code: 'NOT_FOUND', message: 'موقعیت انبار موردنظر یافت نشد.', details: id, fieldErrors: [] });
    }
    if (rows.length !== 1) {
      throw new ApiError({ status: 0, code: 'UNKNOWN', message: 'پاسخ دریافتی از سرور معتبر نیست.', fieldErrors: [] });
    }
    return mapStorageLocationPostgrestRow(rows[0]);
  }
}
