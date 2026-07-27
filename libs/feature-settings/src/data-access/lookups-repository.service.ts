import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import {
  CreateLookupValueRequest,
  CreateLookupValueRpcRequestDto
} from '../dto/create-lookup-value-request.dto';
import type { LookupTypePageResponseDto } from '../dto/lookup-type-page-response.dto';
import type { LookupValuePageResponseDto } from '../dto/lookup-value-page-response.dto';
import type { LookupValueResponseDto } from '../dto/lookup-value-response.dto';
import {
  UpdateLookupValueRequest,
  UpdateLookupValueRpcRequestDto
} from '../dto/update-lookup-value-request.dto';
import {
  mapLookupTypePageResponseDto,
  mapLookupValuePageResponseDto,
  mapLookupValueResponseDto
} from '../mappers/lookups.mapper';
import type { LookupType } from '../models/lookup-type.model';
import type { LookupTypeQuery, LookupValueQuery } from '../models/lookup-query.model';
import type { LookupValue } from '../models/lookup-value.model';

interface ListLookupTypesRpcRequestDto {
  readonly search?: string;
  readonly active?: boolean;
  readonly page_number: number;
  readonly page_size: number;
}

interface ListLookupValuesRpcRequestDto {
  readonly lookup_type_code: string;
  readonly search?: string;
  readonly active?: boolean;
  readonly page_number: number;
  readonly page_size: number;
}

interface SetLookupValueActiveRpcRequestDto {
  readonly value_id: string;
  readonly active: boolean;
}

@Injectable()
export class LookupsRepository {
  private readonly api = inject(ApiClient);

  listTypes(query?: LookupTypeQuery): Observable<ApiPage<LookupType>> {
    return this.api
      .post<ListLookupTypesRpcRequestDto, LookupTypePageResponseDto>(
        'rpc/admin_list_lookup_types',
        {
          search: query?.search,
          active: query?.active,
          page_number: (query?.page ?? 0) + 1,
          page_size: query?.pageSize ?? 50
        },
        { responseShape: 'raw' }
      )
      .pipe(map(mapLookupTypePageResponseDto));
  }

  listValues(query: LookupValueQuery): Observable<ApiPage<LookupValue>> {
    return this.api
      .post<ListLookupValuesRpcRequestDto, LookupValuePageResponseDto>(
        'rpc/admin_list_lookup_values',
        {
          lookup_type_code: query.lookupTypeCode,
          search: query.search,
          active: query.active,
          page_number: (query.page ?? 0) + 1,
          page_size: query.pageSize ?? 20
        },
        { responseShape: 'raw' }
      )
      .pipe(map(mapLookupValuePageResponseDto));
  }

  createValue(request: CreateLookupValueRequest): Observable<LookupValue> {
    return this.api
      .post<CreateLookupValueRpcRequestDto, LookupValueResponseDto>(
        'rpc/admin_create_lookup_value',
        {
          lookup_type_code: request.lookupTypeCode,
          lookup_code: request.code,
          lookup_label: request.label,
          lookup_description: request.description,
          lookup_sort_order: request.sortOrder,
          lookup_metadata: request.metadata,
          lookup_active: request.active
        },
        { responseShape: 'raw' }
      )
      .pipe(map(mapLookupValueResponseDto));
  }

  updateValue(id: string, request: UpdateLookupValueRequest): Observable<LookupValue> {
    return this.api
      .post<UpdateLookupValueRpcRequestDto, LookupValueResponseDto>(
        'rpc/admin_update_lookup_value',
        {
          value_id: id,
          lookup_code: request.code,
          lookup_label: request.label,
          lookup_description: request.description,
          lookup_sort_order: request.sortOrder,
          lookup_metadata: request.metadata,
          lookup_active: request.active
        },
        { responseShape: 'raw' }
      )
      .pipe(map(mapLookupValueResponseDto));
  }

  setValueActive(id: string, active: boolean): Observable<LookupValue> {
    return this.api
      .post<SetLookupValueActiveRpcRequestDto, LookupValueResponseDto>(
        'rpc/admin_set_lookup_value_active',
        {
          value_id: id,
          active
        },
        { responseShape: 'raw' }
      )
      .pipe(map(mapLookupValueResponseDto));
  }
}
