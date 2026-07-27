import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiPage } from '@daqiq/core';
import { Observable, map } from 'rxjs';

import type { SystemSettingPageResponseDto } from '../dto/system-setting-page-response.dto';
import type { SystemSettingResponseDto } from '../dto/system-setting-response.dto';
import {
  UpdateSystemSettingRequest,
  UpdateSystemSettingRpcRequestDto
} from '../dto/update-system-setting-request.dto';
import {
  mapSystemSettingPageResponseDto,
  mapSystemSettingResponseDto
} from '../mappers/settings.mapper';
import type { SystemSetting } from '../models/system-setting.model';
import type { SettingsQuery } from '../models/settings-query.model';

interface ListSettingsRpcRequestDto {
  readonly search?: string;
  readonly category?: string;
  readonly active?: boolean;
  readonly page_number: number;
  readonly page_size: number;
}

@Injectable()
export class SettingsRepository {
  private readonly api = inject(ApiClient);

  list(query?: SettingsQuery): Observable<ApiPage<SystemSetting>> {
    return this.api
      .post<ListSettingsRpcRequestDto, SystemSettingPageResponseDto>(
        'rpc/admin_list_system_settings',
        {
          search: query?.search,
          category: query?.category,
          active: query?.active,
          page_number: (query?.page ?? 0) + 1,
          page_size: query?.pageSize ?? 20
        },
        { responseShape: 'raw' }
      )
      .pipe(map(mapSystemSettingPageResponseDto));
  }

  update(request: UpdateSystemSettingRequest): Observable<SystemSetting> {
    return this.api
      .post<UpdateSystemSettingRpcRequestDto, SystemSettingResponseDto>(
        'rpc/admin_update_system_setting',
        {
          setting_key: request.settingKey,
          setting_value: request.settingValue
        },
        { responseShape: 'raw' }
      )
      .pipe(map(mapSystemSettingResponseDto));
  }
}
