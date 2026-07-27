import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type { FeatureFlagPageResponseDto } from '../dto/feature-flag-page-response.dto';
import type { FeatureFlagResponseDto } from '../dto/feature-flag-response.dto';
import {
  UpdateFeatureFlagRequest,
  UpdateFeatureFlagRpcRequestDto
} from '../dto/update-feature-flag-request.dto';
import {
  mapFeatureFlagPageResponseDto,
  mapFeatureFlagResponseDto
} from '../mappers/feature-flags.mapper';
import type { FeatureFlag } from '../models/feature-flag.model';
import type { FeatureFlagQuery } from '../models/feature-flag-query.model';

interface ListFeatureFlagsRpcRequestDto {
  readonly search?: string;
  readonly category?: string;
  readonly enabled?: boolean;
  readonly page_number: number;
  readonly page_size: number;
}

@Injectable()
export class FeatureFlagsRepository {
  private readonly api = inject(ApiClient);

  list(query?: FeatureFlagQuery): Observable<ApiPage<FeatureFlag>> {
    return this.api
      .post<ListFeatureFlagsRpcRequestDto, FeatureFlagPageResponseDto>(
        'rpc/admin_list_feature_flags',
        {
          search: query?.search,
          category: query?.category,
          enabled: query?.enabled,
          page_number: (query?.page ?? 0) + 1,
          page_size: query?.pageSize ?? 20
        },
        { responseShape: 'raw' }
      )
      .pipe(map(mapFeatureFlagPageResponseDto));
  }

  update(request: UpdateFeatureFlagRequest): Observable<FeatureFlag> {
    return this.api
      .post<UpdateFeatureFlagRpcRequestDto, FeatureFlagResponseDto>(
        'rpc/admin_update_feature_flag',
        {
          flag_key: request.flagKey,
          enabled: request.enabled
        },
        { responseShape: 'raw' }
      )
      .pipe(map(mapFeatureFlagResponseDto));
  }
}
