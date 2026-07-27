import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiClient } from '../../http/api-client/api-client.service';
import { Observable, map, tap } from 'rxjs';

import {
  RuntimeFeatureFlag,
  RuntimeLookupValue,
  RuntimeSettingValue,
  RuntimeSettingValueType,
  RuntimeSystemSetting
} from './runtime-config.model';

interface RuntimeSystemSettingDto {
  readonly id: string;
  readonly settingKey: string;
  readonly settingValue: RuntimeSettingValue;
  readonly valueType: RuntimeSettingValueType;
  readonly category: string;
  readonly label: string;
  readonly description: string | null;
  readonly editable: boolean;
  readonly active: boolean;
}

interface RuntimeLookupValueDto {
  readonly id: string;
  readonly lookupTypeCode: string;
  readonly code: string;
  readonly label: string;
  readonly description: string | null;
  readonly sortOrder: number;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly system: boolean;
  readonly active: boolean;
}

interface RuntimeLookupValuePageDto {
  readonly items: readonly RuntimeLookupValueDto[];
}

interface RuntimeFeatureFlagDto {
  readonly id: string;
  readonly flagKey: string;
  readonly enabled: boolean;
  readonly label: string;
  readonly description: string | null;
  readonly category: string;
}

interface RuntimeFeatureFlagPageDto {
  readonly items: readonly RuntimeFeatureFlagDto[];
}

interface GetSettingRequestDto {
  readonly setting_key: string;
}

interface ListLookupValuesRequestDto {
  readonly lookup_type_code: string;
  readonly active: boolean;
  readonly page_number: number;
  readonly page_size: number;
}

interface ListFeatureFlagsRequestDto {
  readonly search?: string;
  readonly category?: string;
  readonly enabled?: boolean;
  readonly page_number: number;
  readonly page_size: number;
}

@Injectable({
  providedIn: 'root'
})
export class RuntimeConfigService {
  private readonly api = inject(ApiClient);
  private readonly settingsCache = signal<ReadonlyMap<string, RuntimeSystemSetting>>(new Map());
  private readonly lookupCache = signal<ReadonlyMap<string, readonly RuntimeLookupValue[]>>(
    new Map()
  );
  private readonly flagCache = signal<ReadonlyMap<string, RuntimeFeatureFlag>>(new Map());

  readonly cachedSettings = computed(() => this.settingsCache());
  readonly cachedLookups = computed(() => this.lookupCache());
  readonly cachedFeatureFlags = computed(() => this.flagCache());

  getSetting(key: string): Observable<RuntimeSystemSetting> {
    return this.api
      .post<GetSettingRequestDto, RuntimeSystemSettingDto>(
        'rpc/admin_get_system_setting',
        { setting_key: key },
        { responseShape: 'raw' }
      )
      .pipe(
        map(mapSystemSettingDto),
        tap((setting) => this.storeSetting(setting))
      );
  }

  getLookupValues(typeCode: string): Observable<readonly RuntimeLookupValue[]> {
    return this.api
      .post<ListLookupValuesRequestDto, RuntimeLookupValuePageDto>(
        'rpc/admin_list_lookup_values',
        {
          lookup_type_code: typeCode,
          active: true,
          page_number: 1,
          page_size: 500
        },
        { responseShape: 'raw' }
      )
      .pipe(
        map((page) => page.items.map(mapLookupValueDto)),
        tap((values) => this.storeLookupValues(typeCode, values))
      );
  }

  isFeatureEnabled(flagKey: string): Observable<boolean> {
    return this.api
      .post<ListFeatureFlagsRequestDto, RuntimeFeatureFlagPageDto>(
        'rpc/admin_list_feature_flags',
        {
          search: flagKey,
          page_number: 1,
          page_size: 100
        },
        { responseShape: 'raw' }
      )
      .pipe(
        map((page) => page.items.map(mapFeatureFlagDto)),
        tap((flags) => this.storeFeatureFlags(flags)),
        map((flags) => flags.find((flag) => flag.flagKey === flagKey)?.enabled ?? false)
      );
  }

  refresh(): void {
    this.settingsCache.set(new Map());
    this.lookupCache.set(new Map());
    this.flagCache.set(new Map());
  }

  private storeSetting(setting: RuntimeSystemSetting): void {
    const next = new Map(this.settingsCache());
    next.set(setting.settingKey, setting);
    this.settingsCache.set(next);
  }

  private storeLookupValues(
    typeCode: string,
    values: readonly RuntimeLookupValue[]
  ): void {
    const next = new Map(this.lookupCache());
    next.set(typeCode, values);
    this.lookupCache.set(next);
  }

  private storeFeatureFlags(flags: readonly RuntimeFeatureFlag[]): void {
    const next = new Map(this.flagCache());

    for (const flag of flags) {
      next.set(flag.flagKey, flag);
    }

    this.flagCache.set(next);
  }
}

function mapSystemSettingDto(dto: RuntimeSystemSettingDto): RuntimeSystemSetting {
  return {
    id: dto.id,
    settingKey: dto.settingKey,
    settingValue: dto.settingValue,
    valueType: dto.valueType,
    category: dto.category,
    label: dto.label,
    description: dto.description,
    editable: dto.editable,
    active: dto.active
  };
}

function mapLookupValueDto(dto: RuntimeLookupValueDto): RuntimeLookupValue {
  return {
    id: dto.id,
    lookupTypeCode: dto.lookupTypeCode,
    code: dto.code,
    label: dto.label,
    description: dto.description,
    sortOrder: dto.sortOrder,
    metadata: dto.metadata,
    system: dto.system,
    active: dto.active
  };
}

function mapFeatureFlagDto(dto: RuntimeFeatureFlagDto): RuntimeFeatureFlag {
  return {
    id: dto.id,
    flagKey: dto.flagKey,
    enabled: dto.enabled,
    label: dto.label,
    description: dto.description,
    category: dto.category
  };
}
